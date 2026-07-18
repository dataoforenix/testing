import pytest
from httpx import ASGITransport, AsyncClient
from app.application.ai_service import AiService
from app.main import app
from app.schemas.ai import (
    BuyerGuidanceRequest,
    DealContextRequest,
    MerchantSummaryRequest,
    TrustExplanationRequest,
)


@pytest.mark.asyncio
async def test_trust_explanation_fallback_never_sets_score():
    res = await AiService.trust_explanation(
        TrustExplanationRequest(entity_type="merchant", entity_id="x", score=82.0, breakdown={})
    )
    assert res.capability == "trust-explanation"
    assert "Trust Engine" in res.summary or "Trust Engine" in res.disclaimer
    assert "never" in res.disclaimer.lower() or "Trust Engine" in res.disclaimer
    assert res.source in ("fallback", "openai", "gemini")


@pytest.mark.asyncio
async def test_fraud_and_risk_advisory():
    fraud = await AiService.fraud_summary(
        DealContextRequest(title="Phone", amount=100, currency="JOD", status="awaiting_funding")
    )
    risk = await AiService.risk_analysis(
        DealContextRequest(title="Phone", amount=100, status="funded")
    )
    assert fraud.capability == "fraud-summary"
    assert risk.capability == "risk-analysis"
    assert "partner" in fraud.summary.lower() or "escrow" in fraud.summary.lower()


@pytest.mark.asyncio
async def test_merchant_and_buyer_guidance():
    m = await AiService.merchant_summary(
        MerchantSummaryRequest(org_name="Shop", trust_score=70, active_deals=2, released_deals=1)
    )
    b = await AiService.buyer_guidance(
        BuyerGuidanceRequest(trust_score=55, active_purchases=1, next_action="Pay securely")
    )
    assert m.capability == "merchant-summary"
    assert b.capability == "buyer-guidance"


@pytest.mark.asyncio
async def test_ai_routes_require_authentication():
    """All /v1/ai/* capability routes reject unauthenticated callers."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        for path, body in [
            ("/v1/ai/trust-explanation", {"entity_type": "merchant", "entity_id": "x", "score": 50}),
            ("/v1/ai/fraud-summary", {"title": "Item", "amount": 10, "status": "draft"}),
            ("/v1/ai/risk-analysis", {"title": "Item", "amount": 10, "status": "funded"}),
            ("/v1/ai/merchant-summary", {"org_name": "Shop"}),
            ("/v1/ai/buyer-guidance", {"active_purchases": 0}),
        ]:
            res = await ac.post(path, json=body)
            assert res.status_code in (401, 403), f"{path} expected auth failure, got {res.status_code}"


@pytest.mark.asyncio
async def test_ai_routes_succeed_when_authenticated(client):
    res = await client.post(
        "/v1/ai/trust-explanation",
        json={"entity_type": "merchant", "entity_id": "x", "score": 70.0, "breakdown": {}},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["capability"] == "trust-explanation"
    assert "Trust Engine" in data["disclaimer"] or "Trust Engine" in data["summary"]
