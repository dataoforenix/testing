"""
AI provider adapters (OpenAI / Gemini).

Advisory only — never calculates Trust Scores or moves money.
Falls back to deterministic templates when keys are missing or calls fail.
"""
from __future__ import annotations

import json
from typing import Optional

import httpx

from app.core.settings import settings


SYSTEM_PROMPT = (
    "You are Theqa AI, an advisory assistant for a non-custodial escrow platform. "
    "Theqa never holds customer funds — a licensed escrow partner does. "
    "Trust Scores are calculated ONLY by Theqa's deterministic Trust Engine. "
    "You explain scores and flag risk; you never invent a numeric Trust Score, "
    "never claim you calculated the score, and never instruct moving funds. "
    "Respond in concise JSON with keys: title (string), summary (string), "
    "bullets (array of short strings), risk_level (low|medium|high|null)."
)


async def complete_json(user_prompt: str) -> tuple[Optional[dict], str]:
    """
    Returns (parsed_json_or_None, source_label).
    source_label is openai | gemini | fallback
    """
    provider = (settings.AI_PROVIDER or "auto").lower()

    if provider in ("openai", "auto") and settings.OPENAI_API_KEY:
        try:
            data = await _openai_json(user_prompt)
            if data:
                return data, "openai"
        except Exception:
            pass

    if provider in ("gemini", "auto") and settings.GEMINI_API_KEY:
        try:
            data = await _gemini_json(user_prompt)
            if data:
                return data, "gemini"
        except Exception:
            pass

    return None, "fallback"


async def _openai_json(user_prompt: str) -> Optional[dict]:
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.OPENAI_MODEL,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        res.raise_for_status()
        content = res.json()["choices"][0]["message"]["content"]
        return json.loads(content)


async def _gemini_json(user_prompt: str) -> Optional[dict]:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.GEMINI_MODEL}:generateContent"
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": SYSTEM_PROMPT + "\n\n" + user_prompt},
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json",
        },
    }
    async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
        res = await client.post(
            url,
            params={"key": settings.GEMINI_API_KEY},
            json=payload,
        )
        res.raise_for_status()
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
