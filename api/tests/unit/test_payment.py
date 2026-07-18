import pytest
import uuid
import hmac
import hashlib
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.deal.models import Deal
from app.domain.payment.models import PaymentIntent, EscrowHold, LedgerTransaction, LedgerEntry
from app.application.deal_state_machine import DealState
from app.application.payment_service import PaymentService
from app.adapters.payment.mock_provider import MockLicensedEscrowProvider


def test_deal_buyer_pays_protection_fee_helpers():
    deal = Deal(
        org_id=uuid.uuid4(),
        title="Fee math",
        amount=100,
        currency="JOD",
        fee_bps=200,
        fee_payer="buyer",
    )
    assert deal.compute_fee_amount() == 2.0
    assert deal.compute_net_amount() == 100.0
    assert deal.compute_buyer_total() == 102.0
    assert deal.compute_item_minor() == 10000
    assert deal.compute_fee_minor() == 200
    assert deal.compute_buyer_total_minor() == 10200


@pytest.mark.asyncio
async def test_create_payment_intent(client, db_data, db: AsyncSession):
    # Create a random seller
    seller_id = uuid.uuid4()
    from app.domain.auth.models import User
    seller = User(id=seller_id, email=f"seller_{seller_id}@example.com", status="active")
    db.add(seller)
    await db.commit()
    
    # Seller creates a deal in DB
    deal = Deal(
        org_id=db_data["org_id"],
        seller_user_id=seller_id,
        title="Test Deal for Payment",
        description="Test",
        amount=100,
        currency="JOD",
        fulfillment_mode="standard",
        fee_bps=200,
        fee_payer="buyer",
        status=DealState.DRAFT.value
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    
    # Buyer (the default client user) accepts deal
    response_accept = await client.post(f"/v1/deals/{deal.id}/accept")
    assert response_accept.status_code == 200
    
    # Buyer creates payment intent
    idempotency_key = f"idemp_{uuid.uuid4()}"
    response_pi = await client.post(
        f"/v1/deals/{deal.id}/payment-intents",
        headers={"Idempotency-Key": idempotency_key}
    )
    assert response_pi.status_code == 200
    pi_data = response_pi.json()
    assert "intent_id" in pi_data
    # Item 100.00 JOD + 2% Protection Fee (200 bps) = 102.00 → 10200 minor
    assert pi_data["amount_minor"] == 10200
    assert pi_data["item_minor"] == 10000
    assert pi_data["protection_fee_minor"] == 200
    assert "authorization_url" in pi_data
    assert "/pay/banks" in pi_data["authorization_url"]
    assert str(deal.id) in pi_data["authorization_url"]
    assert deal.public_code in pi_data["authorization_url"]
    
    # Test idempotency
    response_pi2 = await client.post(
        f"/v1/deals/{deal.id}/payment-intents",
        headers={"Idempotency-Key": idempotency_key}
    )
    assert response_pi2.status_code == 200
    assert response_pi2.json()["intent_id"] == pi_data["intent_id"]


@pytest.mark.asyncio
async def test_partner_hold_mirrors_buyer_total(db_data, db: AsyncSession):
    """Licensed partner hold = item + fee; seller_net = item; ledger balances."""
    from app.domain.auth.models import User

    seller_id = uuid.uuid4()
    buyer_id = uuid.uuid4()
    db.add_all(
        [
            User(id=seller_id, email=f"s_{seller_id}@ex.com", status="active"),
            User(id=buyer_id, email=f"b_{buyer_id}@ex.com", status="active"),
        ]
    )
    await db.commit()

    deal = Deal(
        org_id=db_data["org_id"],
        seller_user_id=seller_id,
        buyer_user_id=buyer_id,
        title="Partner hold math",
        amount=100,
        currency="JOD",
        fee_bps=200,
        fee_payer="buyer",
        status=DealState.AWAITING_FUNDING.value,
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)

    # Avoid auto webhook race: create intent row without scheduling mock fire
    from app.application import payment_service as ps

    original = ps.provider.create_payment_intent

    async def silent_intent(*args, **kwargs):
        return f"mock_pi_{uuid.uuid4().hex[:12]}"

    ps.provider.create_payment_intent = silent_intent
    try:
        intent = await PaymentService.create_intent(
            db, deal, deal.compute_buyer_total_minor(), "JOD", f"idemp_{uuid.uuid4()}"
        )
    finally:
        ps.provider.create_payment_intent = original

    payload = json.dumps(
        {
            "intent_id": intent.provider_intent_id,
            "status": "succeeded",
            "event_type": "payment.succeeded",
        }
    ).encode("utf-8")
    sig = hmac.new(
        MockLicensedEscrowProvider().webhook_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    await PaymentService.process_webhook(db, payload, sig)

    hold = (
        await db.execute(select(EscrowHold).where(EscrowHold.deal_id == deal.id))
    ).scalar_one()
    assert hold.amount_minor == 10200
    assert hold.seller_net_minor == 10000
    assert hold.fee_minor == 200
    assert hold.amount_minor == hold.seller_net_minor + hold.fee_minor

    entries = (
        await db.execute(
            select(LedgerEntry)
            .join(LedgerTransaction)
            .where(LedgerTransaction.deal_id == deal.id, LedgerTransaction.type == "fund_escrow")
        )
    ).scalars().all()
    debits = sum(e.amount_minor for e in entries if e.type == "DEBIT")
    credits = sum(e.amount_minor for e in entries if e.type == "CREDIT")
    assert debits == credits == 10200

    await db.refresh(deal)
    assert deal.status == DealState.FUNDED.value


@pytest.mark.asyncio
async def test_webhook_hmac_signature(client):
    payload = {"intent_id": "mock_pi_123", "status": "succeeded"}
    payload_bytes = json.dumps(payload).encode('utf-8')
    
    # Missing signature
    response = await client.post(
        "/v1/webhooks/mock-provider",
        content=payload_bytes,
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 401
    
    # Invalid signature
    response_invalid = await client.post(
        "/v1/webhooks/mock-provider",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Mock-Provider-Signature": "invalid"}
    )
    assert response_invalid.status_code == 401
    
    # Valid signature
    provider = MockLicensedEscrowProvider()
    valid_signature = hmac.new(
        provider.webhook_secret.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    
    response_valid = await client.post(
        "/v1/webhooks/mock-provider",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Mock-Provider-Signature": valid_signature}
    )
    assert response_valid.status_code == 200
