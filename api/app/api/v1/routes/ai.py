from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.application.ai_service import AiService
from app.domain.auth.models import User
from app.schemas.ai import (
    AiInsightResponse,
    BuyerGuidanceRequest,
    DealContextRequest,
    MerchantSummaryRequest,
    TrustExplanationRequest,
)

router = APIRouter()


@router.post("/trust-explanation", response_model=AiInsightResponse)
async def trust_explanation(
    req: TrustExplanationRequest,
    _current_user: User = Depends(get_current_user),
):
    """Explain a Trust Engine score. AI does not calculate the score."""
    return await AiService.trust_explanation(req)


@router.post("/fraud-summary", response_model=AiInsightResponse)
async def fraud_summary(
    req: DealContextRequest,
    _current_user: User = Depends(get_current_user),
):
    return await AiService.fraud_summary(req)


@router.post("/risk-analysis", response_model=AiInsightResponse)
async def risk_analysis(
    req: DealContextRequest,
    _current_user: User = Depends(get_current_user),
):
    return await AiService.risk_analysis(req)


@router.post("/merchant-summary", response_model=AiInsightResponse)
async def merchant_summary(
    req: MerchantSummaryRequest,
    _current_user: User = Depends(get_current_user),
):
    return await AiService.merchant_summary(req)


@router.post("/buyer-guidance", response_model=AiInsightResponse)
async def buyer_guidance(
    req: BuyerGuidanceRequest,
    _current_user: User = Depends(get_current_user),
):
    return await AiService.buyer_guidance(req)
