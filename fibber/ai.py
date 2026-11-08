"""Multi-provider AI completion client supporting Gemini, OpenAI, Anthropic, and Meta (Groq/Together).

Configured via environment variables / GitHub Secrets:
- AI_PROVIDER: 'gemini' | 'openai' | 'anthropic' | 'meta' | 'groq' | 'together'
- AI_MODEL: model name override (e.g. 'gemini-2.0-flash', 'gpt-4o', 'claude-3-5-sonnet-20241022', 'llama-3.3-70b-versatile')
- AI_API_KEY: universal API key (or GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, META_API_KEY, GROQ_API_KEY)
"""

import json
import logging
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Default model per provider
DEFAULT_MODELS: Dict[str, str] = {
    "gemini": "gemini-2.0-flash",
    "google": "gemini-2.0-flash",
    "openai": "gpt-4o",
    "anthropic": "claude-3-5-sonnet-20241022",
    "meta": "llama-3.3-70b-versatile",
    "groq": "llama-3.3-70b-versatile",
    "together": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
}


def resolve_provider_and_key() -> Tuple[str, str, str]:
    """Auto-detect the AI provider, model, and active API key from environment."""
    provider = (os.getenv("AI_PROVIDER") or "").strip().lower()
    universal_key = (os.getenv("AI_API_KEY") or "").strip()

    # Provider specific keys
    gemini_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
    openai_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    anthropic_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    meta_key = (os.getenv("META_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("TOGETHER_API_KEY") or "").strip()

    # Auto-detect provider if not explicitly given
    if not provider:
        if gemini_key:
            provider = "gemini"
        elif openai_key:
            provider = "openai"
        elif anthropic_key:
            provider = "anthropic"
        elif meta_key:
            provider = "meta"
        elif universal_key:
            provider = "gemini"  # default modern provider
        else:
            provider = "anthropic"

    # Select the API key
    api_key = universal_key
    if provider in ("gemini", "google") and gemini_key:
        api_key = gemini_key
    elif provider == "openai" and openai_key:
        api_key = openai_key
    elif provider == "anthropic" and anthropic_key:
        api_key = anthropic_key
    elif provider in ("meta", "groq", "together") and meta_key:
        api_key = meta_key

    # Resolve Model
    model = (os.getenv("AI_MODEL") or os.getenv(f"{provider.upper()}_MODEL") or "").strip()
    if not model:
        model = DEFAULT_MODELS.get(provider, "gemini-2.0-flash")

    return provider, model, api_key


def generate_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.5,
    max_tokens: int = 2048,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
) -> str:
    """Send prompt to the configured AI provider and return response text."""
    resolved_prov, resolved_mod, resolved_key = resolve_provider_and_key()
    provider = (provider or resolved_prov).lower()
    model = model or resolved_mod
    api_key = api_key or resolved_key

    if not api_key:
        raise ValueError(
            f"No API key provided for AI provider '{provider}'. "
            f"Please set {provider.upper()}_API_KEY or AI_API_KEY in environment/secrets."
        )

    logger.info("Calling AI completion using provider: %s, model: %s", provider, model)

    if provider in ("gemini", "google"):
        return _call_gemini(system_prompt, user_prompt, model, api_key, temperature, max_tokens)
    elif provider == "openai":
        return _call_openai(system_prompt, user_prompt, model, api_key, temperature, max_tokens)
    elif provider in ("meta", "groq", "together"):
        return _call_meta_openai_compat(provider, system_prompt, user_prompt, model, api_key, temperature, max_tokens)
    elif provider == "anthropic":
        return _call_anthropic(system_prompt, user_prompt, model, api_key, temperature, max_tokens)
    else:
        raise ValueError(f"Unsupported AI_PROVIDER '{provider}'. Supported: gemini, openai, anthropic, meta, groq, together.")


def _call_gemini(
    system_prompt: str,
    user_prompt: str,
    model: str,
    api_key: str,
    temperature: float,
    max_tokens: int,
) -> str:
    """Call Google Gemini REST API directly."""
    # Ensure standard model format
    if not model.startswith("models/"):
        model_name = model
    else:
        model_name = model.replace("models/", "")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            "responseMimeType": "application/json" if "JSON" in user_prompt or "JSON" in system_prompt else "text/plain"
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return ""
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error("Gemini API Error (%d): %s", e.code, error_body)
        raise RuntimeError(f"Gemini API returned error {e.code}: {error_body}") from e


def _call_openai(
    system_prompt: str,
    user_prompt: str,
    model: str,
    api_key: str,
    temperature: float,
    max_tokens: int,
) -> str:
    """Call OpenAI Chat Completions API."""
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error("OpenAI API Error (%d): %s", e.code, error_body)
        raise RuntimeError(f"OpenAI API returned error {e.code}: {error_body}") from e


def _call_meta_openai_compat(
    provider: str,
    system_prompt: str,
    user_prompt: str,
    model: str,
    api_key: str,
    temperature: float,
    max_tokens: int,
) -> str:
    """Call Meta Llama via Groq or Together AI endpoints."""
    if provider in ("groq", "meta"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        if not model or model == "default":
            model = "llama-3.3-70b-versatile"
    elif provider == "together":
        url = "https://api.together.xyz/v1/chat/completions"
        if not model or model == "default":
            model = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
    else:
        url = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error("Meta/Groq API Error (%d): %s", e.code, error_body)
        raise RuntimeError(f"Meta/Groq API returned error {e.code}: {error_body}") from e


def _call_anthropic(
    system_prompt: str,
    user_prompt: str,
    model: str,
    api_key: str,
    temperature: float,
    max_tokens: int,
) -> str:
    """Call Anthropic API directly via HTTPS (no anthropic package dependency required)."""
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}]
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content_blocks = data.get("content", [])
            return "".join(b.get("text", "") for b in content_blocks if b.get("type") == "text")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error("Anthropic API Error (%d): %s", e.code, error_body)
        raise RuntimeError(f"Anthropic API returned error {e.code}: {error_body}") from e


def clean_json_response(raw_text: str) -> str:
    """Clean markdown code fences and extraneous text from LLM JSON response."""
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    # Find bounding JSON bracket/brace if extra commentary was appended
    if not (cleaned.startswith("{") or cleaned.startswith("[")):
        match = re.search(r"(\[.*\]|\{.*\})", cleaned, flags=re.DOTALL)
        if match:
            cleaned = match.group(1).strip()

    return cleaned
