from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

class DealEventResponse(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    from_state: Optional[str] = None
    to_state: str
    metadata_payload: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class DealParticipantResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    org_id: Optional[uuid.UUID] = None
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DealCreate(BaseModel):
    org_id: uuid.UUID
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    amount: float = Field(..., gt=0)
    currency: str = "JOD"
    fulfillment_mode: str = "standard"
    fee_bps: int = Field(0, ge=0)
    # MVP: buyer always pays Theqa Protection Fee; seller receives full item price.
    fee_payer: str = "buyer"

class DealResponse(BaseModel):
    id: uuid.UUID
    public_code: str
    org_id: uuid.UUID
    seller_user_id: Optional[uuid.UUID] = None
    buyer_user_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    amount: float
    currency: str
    status: str
    fulfillment_mode: str
    fee_bps: int
    fee_payer: str
    net_amount: Optional[float] = None # Calculated field
    fee_amount: Optional[float] = None # Calculated field
    version: int
    created_at: datetime
    updated_at: datetime
    
    events: List[DealEventResponse] = []
    participants: List[DealParticipantResponse] = []
    checkout_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentIntentSummary(BaseModel):
    id: uuid.UUID
    provider_intent_id: str
    status: str
    amount: float
    currency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EscrowHoldSummary(BaseModel):
    id: uuid.UUID
    status: str
    amount_minor: int
    fee_minor: int
    seller_net_minor: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LedgerTxnSummary(BaseModel):
    id: uuid.UUID
    type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DealCustodyResponse(BaseModel):
    """Partner escrow mirror — Theqa never holds funds."""
    deal_id: uuid.UUID
    deal_status: str
    currency: str
    custody_notice: str = (
        "Funds are held by the licensed escrow partner. Theqa mirrors partner state only."
    )
    payment_intent: Optional[PaymentIntentSummary] = None
    escrow_hold: Optional[EscrowHoldSummary] = None
    ledger_transactions: List[LedgerTxnSummary] = []


class ShipmentSummary(BaseModel):
    id: uuid.UUID
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConfirmationSummary(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DealFulfillmentResponse(BaseModel):
    deal_id: uuid.UUID
    shipments: List[ShipmentSummary] = []
    confirmations: List[ConfirmationSummary] = []
