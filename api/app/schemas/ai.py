from pydantic import BaseModel, Field
from typing import Any, Optional


class AiInsightResponse(BaseModel):
    capability: str
    title: str
    summary: str
    bullets: list[str] = Field(default_factory=list)
    risk_level: Optional[str] = None  # low | medium | high
    source: str = "fallback"  # fallback | openai | gemini
    disclaimer: str = (
        "AI-generated insight · Trust Score is calculated by the Theqa Trust Engine. "
        "AI never moves funds or sets scores."
    )


class TrustExplanationRequest(BaseModel):
    entity_type: str = Field(..., pattern="^(individual|merchant)$")
    entity_id: str
    score: Optional[float] = None
    breakdown: Optional[dict[str, Any]] = None


class DealContextRequest(BaseModel):
    deal_id: Optional[str] = None
    title: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "JOD"
    status: Optional[str] = None
    fee_bps: Optional[int] = None
    seller_score: Optional[float] = None
    buyer_score: Optional[float] = None


class MerchantSummaryRequest(BaseModel):
    org_name: Optional[str] = None
    trust_score: Optional[float] = None
    active_deals: int = 0
    released_deals: int = 0
    volume: float = 0


class BuyerGuidanceRequest(BaseModel):
    trust_score: Optional[float] = None
    active_purchases: int = 0
    next_action: Optional[str] = None
    deal_status: Optional[str] = None
