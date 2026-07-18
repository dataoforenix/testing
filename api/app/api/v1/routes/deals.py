from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
import uuid
from typing import List

from app.api.deps import get_db, get_current_user, get_current_user_or_partner
from app.domain.auth.models import User, ApiClient
from app.domain.deal.models import Deal, DealParticipant
from app.schemas.deal import (
    DealCreate,
    DealResponse,
    DealCustodyResponse,
    DealFulfillmentResponse,
    PaymentIntentSummary,
    EscrowHoldSummary,
    LedgerTxnSummary,
    ShipmentSummary,
    ConfirmationSummary,
)
from app.application.deal_state_machine import DealStateMachine, StateTransitionError, DealState
from app.core.settings import settings

router = APIRouter()

@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    req: DealCreate, 
    db: AsyncSession = Depends(get_db), 
    current_entity: User | ApiClient = Depends(get_current_user_or_partner)
):
    """Create a new deal programmatically or as a seller."""
    seller_user_id = None
    org_id = req.org_id
    
    if isinstance(current_entity, ApiClient):
        org_id = current_entity.org_id
        if "deals:write" not in current_entity.scopes:
            raise HTTPException(status_code=403, detail="API client lacks deals:write scope")
    else:
        seller_user_id = current_entity.id
        
    deal = Deal(
        org_id=org_id,
        seller_user_id=seller_user_id,
        title=req.title,
        description=req.description,
        amount=req.amount,
        currency=req.currency,
        fulfillment_mode=req.fulfillment_mode,
        fee_bps=req.fee_bps,
        # MVP policy: buyer pays Theqa Protection Fee; seller receives full item price.
        fee_payer="buyer",
        status=DealState.DRAFT.value
    )
    db.add(deal)
    await db.flush() # flush to get deal.id

    if seller_user_id:
        # Add the seller as a participant if created by user
        participant = DealParticipant(
            deal_id=deal.id,
            user_id=seller_user_id,
            org_id=org_id,
            role="seller"
        )
        db.add(participant)
        
    await db.commit()
    
    result = await db.execute(
        select(Deal)
        .options(selectinload(Deal.events), selectinload(Deal.participants))
        .where(Deal.id == deal.id)
        .execution_options(populate_existing=True)
    )
    deal_eager = result.scalar_one()
    deal_eager.net_amount = deal_eager.compute_net_amount()
    deal_eager.fee_amount = deal_eager.compute_fee_amount()
    deal_eager.checkout_url = f"{settings.FRONTEND_URL}/checkout/{deal_eager.public_code}"
    return deal_eager

@router.get("", response_model=List[DealResponse])
async def list_deals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List deals where the current user is a seller or buyer."""
    result = await db.execute(
        select(Deal)
        .options(selectinload(Deal.events), selectinload(Deal.participants))
        .where(
            or_(
                Deal.seller_user_id == current_user.id,
                Deal.buyer_user_id == current_user.id
            )
        )
    )
    deals = result.scalars().all()
    for deal in deals:
        deal.net_amount = deal.compute_net_amount()
        deal.fee_amount = deal.compute_fee_amount()
    return deals

@router.get("/{id}", response_model=DealResponse)
async def get_deal(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific deal by ID."""
    result = await db.execute(
        select(Deal)
        .options(selectinload(Deal.events), selectinload(Deal.participants))
        .where(Deal.id == id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check authorization
    if deal.seller_user_id != current_user.id and deal.buyer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this deal")
        
    deal.net_amount = deal.compute_net_amount()
    deal.fee_amount = deal.compute_fee_amount()
    return deal

@router.get("/{id}/custody", response_model=DealCustodyResponse)
async def get_deal_custody(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Expose partner escrow mirror + payment intent for a deal participant."""
    from app.domain.payment.models import PaymentIntent, EscrowHold, LedgerTransaction

    deal = (await db.execute(select(Deal).where(Deal.id == id))).scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if current_user.id not in {deal.seller_user_id, deal.buyer_user_id}:
        raise HTTPException(status_code=403, detail="Not authorized to view custody for this deal")

    intent = (
        await db.execute(
            select(PaymentIntent)
            .where(PaymentIntent.deal_id == deal.id)
            .order_by(PaymentIntent.created_at.desc())
        )
    ).scalars().first()

    hold = None
    if intent:
        hold = (
            await db.execute(
                select(EscrowHold).where(EscrowHold.payment_intent_id == intent.id)
            )
        ).scalar_one_or_none()

    txns = (
        await db.execute(
            select(LedgerTransaction)
            .where(LedgerTransaction.deal_id == deal.id)
            .order_by(LedgerTransaction.created_at.asc())
        )
    ).scalars().all()

    return DealCustodyResponse(
        deal_id=deal.id,
        deal_status=deal.status,
        currency=deal.currency,
        payment_intent=PaymentIntentSummary.model_validate(intent) if intent else None,
        escrow_hold=EscrowHoldSummary.model_validate(hold) if hold else None,
        ledger_transactions=[LedgerTxnSummary.model_validate(t) for t in txns],
    )


@router.get("/{id}/fulfillment", response_model=DealFulfillmentResponse)
async def get_deal_fulfillment(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Shipments and delivery confirmations for a deal participant."""
    from app.domain.fulfillment.models import Shipment, FulfillmentConfirmation

    deal = (await db.execute(select(Deal).where(Deal.id == id))).scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if current_user.id not in {deal.seller_user_id, deal.buyer_user_id}:
        raise HTTPException(status_code=403, detail="Not authorized to view fulfillment for this deal")

    shipments = (
        await db.execute(
            select(Shipment)
            .where(Shipment.deal_id == deal.id)
            .order_by(Shipment.created_at.desc())
        )
    ).scalars().all()
    confirmations = (
        await db.execute(
            select(FulfillmentConfirmation)
            .where(FulfillmentConfirmation.deal_id == deal.id)
            .order_by(FulfillmentConfirmation.created_at.desc())
        )
    ).scalars().all()

    return DealFulfillmentResponse(
        deal_id=deal.id,
        shipments=[ShipmentSummary.model_validate(s) for s in shipments],
        confirmations=[ConfirmationSummary.model_validate(c) for c in confirmations],
    )

@router.get("/by-code/{code}", response_model=DealResponse)
async def get_deal_by_code(
    code: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint to fetch a deal via its public_code (e.g. for a buyer checking out)."""
    result = await db.execute(
        select(Deal)
        .options(selectinload(Deal.events), selectinload(Deal.participants))
        .where(Deal.public_code == code)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    deal.net_amount = deal.compute_net_amount()
    deal.fee_amount = deal.compute_fee_amount()
    return deal

@router.post("/{id}/accept", response_model=DealResponse)
async def accept_deal(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a draft deal as a buyer."""
    result = await db.execute(
        select(Deal)
        .options(selectinload(Deal.events), selectinload(Deal.participants))
        .where(Deal.id == id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    if deal.seller_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Seller cannot accept their own deal")
        
    try:
        # Transition state
        await DealStateMachine.transition(db, deal, DealState.AWAITING_FUNDING.value, actor_id=current_user.id)
        
        # Attach buyer
        deal.buyer_user_id = current_user.id
        
        # Add the buyer as a participant
        participant = DealParticipant(
            deal_id=deal.id,
            user_id=current_user.id,
            role="buyer"
        )
        db.add(participant)
        
        await db.commit()
        
        # Re-query to eagerly load relations and populate existing identity map
        result = await db.execute(
            select(Deal)
            .options(selectinload(Deal.events), selectinload(Deal.participants))
            .where(Deal.id == deal.id)
            .execution_options(populate_existing=True)
        )
        deal_eager = result.scalar_one()
        deal_eager.net_amount = deal_eager.compute_net_amount()
        deal_eager.fee_amount = deal_eager.compute_fee_amount()
        return deal_eager
    except StateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.post("/{id}/cancel", response_model=DealResponse)
async def cancel_deal(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a deal."""
    result = await db.execute(
        select(Deal)
        .options(selectinload(Deal.events), selectinload(Deal.participants))
        .where(Deal.id == id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    if deal.seller_user_id != current_user.id and deal.buyer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this deal")
        
    try:
        await DealStateMachine.transition(db, deal, DealState.CANCELLED.value, actor_id=current_user.id)
        await db.commit()
        
        result = await db.execute(
            select(Deal)
            .options(selectinload(Deal.events), selectinload(Deal.participants))
            .where(Deal.id == deal.id)
            .execution_options(populate_existing=True)
        )
        deal_eager = result.scalar_one()
        deal_eager.net_amount = deal_eager.compute_net_amount()
        deal_eager.fee_amount = deal_eager.compute_fee_amount()
        return deal_eager
    except StateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

from fastapi import Header
from app.application.payment_service import PaymentService

@router.post("/{id}/payment-intents")
async def create_deal_payment_intent(
    id: uuid.UUID = Path(...),
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a payment intent for a deal. Requires an Idempotency-Key header."""
    result = await db.execute(
        select(Deal)
        .where(Deal.id == id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    if deal.buyer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the buyer can create a payment intent")
        
    if deal.status != DealState.AWAITING_FUNDING.value:
        raise HTTPException(status_code=409, detail=f"Cannot create payment intent in state {deal.status}")

    # Total authorized to the licensed escrow partner (item + Theqa Protection Fee).
    # Theqa does not hold these funds — the partner does; we record a shadow ledger mirror.
    amount_minor = deal.compute_buyer_total_minor()
    item_minor = deal.compute_item_minor()
    fee_minor = deal.compute_fee_minor()
    
    intent = await PaymentService.create_intent(
        db=db,
        deal=deal,
        amount_minor=amount_minor,
        currency=deal.currency,
        idempotency_key=idempotency_key
    )
    
    return {
        "intent_id": str(intent.id),
        "provider_intent_id": intent.provider_intent_id,
        "status": intent.status,
        "amount_minor": amount_minor,
        "item_minor": item_minor,
        "protection_fee_minor": fee_minor,
        "currency": intent.currency,
        # Sandbox Open Banking authorization URL (frontend simulation).
        # Funds are held by the licensed escrow partner — not Theqa.
        "authorization_url": (
            f"{settings.FRONTEND_URL}/pay/banks"
            f"?deal={deal.id}&code={deal.public_code}"
        ),
    }

from pydantic import BaseModel
from app.domain.fulfillment.models import Shipment, FulfillmentConfirmation

class ShipmentCreate(BaseModel):
    tracking_number: str | None = None
    carrier: str | None = None

@router.post("/{id}/shipments")
async def create_shipment(
    req: ShipmentCreate,
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark the deal as shipped."""
    deal = (await db.execute(select(Deal).where(Deal.id == id))).scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    if deal.seller_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only seller can ship")
        
    if deal.status != DealState.FUNDED.value:
        raise HTTPException(status_code=409, detail=f"Cannot ship in state {deal.status}")
        
    shipment = Shipment(deal_id=deal.id, tracking_number=req.tracking_number, carrier=req.carrier, status="shipped")
    db.add(shipment)
    
    await DealStateMachine.transition(db, deal, DealState.IN_FULFILLMENT.value, actor_id=current_user.id)
    await db.commit()
    return {"status": "success", "shipment_id": str(shipment.id)}

class ConfirmationCreate(BaseModel):
    notes: str | None = None

@router.post("/{id}/confirmations")
async def create_confirmation(
    req: ConfirmationCreate,
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm delivery."""
    deal = (await db.execute(select(Deal).where(Deal.id == id))).scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    if deal.buyer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only buyer can confirm delivery")
        
    if deal.status != DealState.IN_FULFILLMENT.value:
        raise HTTPException(status_code=409, detail=f"Cannot confirm delivery in state {deal.status}")
        
    conf = FulfillmentConfirmation(deal_id=deal.id, user_id=current_user.id, notes=req.notes)
    db.add(conf)
    
    await DealStateMachine.transition(db, deal, DealState.DELIVERY_CONFIRMED.value, actor_id=current_user.id)
    await db.commit()
    return {"status": "success", "confirmation_id": str(conf.id)}

@router.post("/{id}/release")
async def release_funds(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger release via the licensed escrow partner (seller or buyer participant)."""
    deal = (await db.execute(select(Deal).where(Deal.id == id))).scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if current_user.id not in {deal.seller_user_id, deal.buyer_user_id}:
        raise HTTPException(status_code=403, detail="Only deal participants can release funds")
        
    await PaymentService.trigger_release(db, deal, current_user.id)
    return {"status": "success", "message": "Release pending"}

@router.post("/{id}/refunds")
async def refund_funds(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger a refund via the licensed escrow partner."""
    deal = (await db.execute(select(Deal).where(Deal.id == id))).scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if current_user.id not in {deal.seller_user_id, deal.buyer_user_id}:
        raise HTTPException(status_code=403, detail="Only deal participants can refund")
        
    await PaymentService.trigger_refund(db, deal, current_user.id)
    return {"status": "success", "message": "Refund pending"}
