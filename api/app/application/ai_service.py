"""
Theqa AI Service — advisory layer only.

Does NOT calculate Trust Scores.
Does NOT move or hold funds.
"""
from __future__ import annotations

from typing import Any, Optional

from app.adapters.ai.provider import complete_json
from app.schemas.ai import (
    AiInsightResponse,
    BuyerGuidanceRequest,
    DealContextRequest,
    MerchantSummaryRequest,
    TrustExplanationRequest,
)


def _pack(
    capability: str,
    title: str,
    summary: str,
    bullets: list[str],
    *,
    risk_level: Optional[str] = None,
    source: str = "fallback",
) -> AiInsightResponse:
    return AiInsightResponse(
        capability=capability,
        title=title,
        summary=summary,
        bullets=bullets[:5],
        risk_level=risk_level,
        source=source,
    )


def _from_model(capability: str, data: dict, source: str) -> AiInsightResponse:
    return _pack(
        capability,
        str(data.get("title") or "Insight"),
        str(data.get("summary") or ""),
        [str(b) for b in (data.get("bullets") or [])],
        risk_level=data.get("risk_level"),
        source=source,
    )


class AiService:
    @staticmethod
    async def trust_explanation(req: TrustExplanationRequest) -> AiInsightResponse:
        score = req.score
        breakdown = req.breakdown or {}
        top = sorted(
            breakdown.items(),
            key=lambda kv: float((kv[1] or {}).get("contribution", 0) if isinstance(kv[1], dict) else 0),
            reverse=True,
        )[:3]

        fallback_bullets = []
        for key, part in top:
            if isinstance(part, dict):
                prior = " (cold-start prior)" if part.get("applied_prior") else ""
                fallback_bullets.append(
                    f"{key.replace('_', ' ').title()}: {float(part.get('value', 0)):.0f}/100{prior}"
                )

        if score is None:
            fb = _pack(
                "trust-explanation",
                "Trust score is building",
                "No Trust Engine score is stored yet for this profile. New accounts are not treated as high risk — "
                "verification and completed deals build the score over time.",
                fallback_bullets
                or [
                    "Trust Engine uses weighted rules and cold-start priors",
                    "AI explains outcomes; it does not set the numeric score",
                ],
            )
        else:
            band = "strong" if score >= 70 else "moderate" if score >= 40 else "early-stage"
            fb = _pack(
                "trust-explanation",
                f"Trust Engine score {score:.0f} ({band})",
                f"This {req.entity_type} Trust Score of {score:.0f}/100 was produced by Theqa's deterministic "
                f"Trust Engine using weighted behavioral factors. AI only narrates those factors.",
                fallback_bullets
                or [
                    "Higher scores reflect verified history and successful completions",
                    "Priors soften cold-start until enough deals exist",
                ],
            )

        prompt = (
            f"Explain this Trust Engine score for a {req.entity_type}. "
            f"Score={score}. Breakdown={breakdown}. "
            "Do not invent a different score."
        )
        data, source = await complete_json(prompt)
        if data and source != "fallback":
            return _from_model("trust-explanation", data, source)
        return fb

    @staticmethod
    async def fraud_summary(req: DealContextRequest) -> AiInsightResponse:
        amount = req.amount or 0
        risk = "low"
        if amount >= 2000:
            risk = "medium"
        if amount >= 5000:
            risk = "high"
        if req.seller_score is not None and req.seller_score < 40:
            risk = "high" if risk != "low" else "medium"

        fb = _pack(
            "fraud-summary",
            "Fraud advisory check",
            f"Advisory review for “{req.title or 'this deal'}” at {amount:.2f} {req.currency}. "
            "Escrow funds (if paid) are held by the licensed partner — not Theqa.",
            [
                "Confirm item description matches what you expect to receive",
                "Prefer handoff with tracking when amounts are material",
                "Release only after you verify delivery",
            ],
            risk_level=risk,
        )
        prompt = (
            f"Write a short fraud advisory for escrow deal title={req.title}, amount={amount} "
            f"{req.currency}, status={req.status}, seller_score={req.seller_score}, "
            f"buyer_score={req.buyer_score}. Advisory only."
        )
        data, source = await complete_json(prompt)
        if data and source != "fallback":
            return _from_model("fraud-summary", data, source)
        return fb

    @staticmethod
    async def risk_analysis(req: DealContextRequest) -> AiInsightResponse:
        status = req.status or "unknown"
        risk = "low"
        if status in ("awaiting_funding", "draft"):
            risk = "low"
        elif status in ("funded", "in_fulfillment"):
            risk = "medium"
        elif status in ("refund_pending", "release_pending"):
            risk = "medium"

        fb = _pack(
            "risk-analysis",
            "Deal risk snapshot",
            f"Current state “{status}”. Operational risk is managed by partner-held escrow and "
            "explicit release conditions. Theqa orchestrates workflow only.",
            [
                f"Lifecycle status: {status}",
                "Partner custody reduces counterparty settlement risk",
                "Confirm delivery before authorizing release",
            ],
            risk_level=risk,
        )
        prompt = (
            f"Risk analysis for escrow deal status={status}, amount={req.amount}, "
            f"seller_score={req.seller_score}, buyer_score={req.buyer_score}."
        )
        data, source = await complete_json(prompt)
        if data and source != "fallback":
            return _from_model("risk-analysis", data, source)
        return fb

    @staticmethod
    async def merchant_summary(req: MerchantSummaryRequest) -> AiInsightResponse:
        fb = _pack(
            "merchant-summary",
            "Merchant workspace briefing",
            f"{req.org_name or 'Your shop'} has {req.active_deals} active escrow deal(s) and "
            f"{req.released_deals} completed. Trust Engine score: "
            f"{'—' if req.trust_score is None else f'{req.trust_score:.0f}'}."
            " Keep shipping promptly after partner funding to strengthen trust.",
            [
                "Share checkout links only for accurate item descriptions",
                "Mark shipped with tracking when available",
                "Seller always receives full item price after release",
            ],
        )
        prompt = (
            f"Merchant summary org={req.org_name} trust={req.trust_score} "
            f"active={req.active_deals} released={req.released_deals} volume={req.volume}."
        )
        data, source = await complete_json(prompt)
        if data and source != "fallback":
            return _from_model("merchant-summary", data, source)
        return fb

    @staticmethod
    async def buyer_guidance(req: BuyerGuidanceRequest) -> AiInsightResponse:
        action = req.next_action or "Review your active purchases"
        fb = _pack(
            "buyer-guidance",
            "Buyer guidance",
            f"Suggested next step: {action}. "
            "When you pay, funds are authorized to the licensed escrow partner — Theqa never holds them.",
            [
                "Use Open Banking authorization on checkout",
                "Confirm delivery only when the item is received as described",
                "Trust Engine scores improve with successful completions",
            ],
        )
        prompt = (
            f"Buyer guidance trust={req.trust_score} active={req.active_purchases} "
            f"next={req.next_action} status={req.deal_status}."
        )
        data, source = await complete_json(prompt)
        if data and source != "fallback":
            return _from_model("buyer-guidance", data, source)
        return fb
