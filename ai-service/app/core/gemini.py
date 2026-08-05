import asyncio
import logging
from typing import List, Optional

import google.generativeai as genai
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)

PREFER_FALLBACK_MODELS = [
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-pro-latest",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]


class GeminiProvider:
    """
    Reusable Gemini LLM Provider.
    Supports model discovery, validation, automatic model fallback,
    and structured logging.
    """

    def __init__(self) -> None:
        self.api_key: str = ""
        self.configured_model_name: str = ""
        self.active_model_name: str = ""
        self._model: Optional[genai.GenerativeModel] = None
        self._supported_models: List[str] = []

    def configure(self) -> None:
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.configured_model_name = settings.gemini_model.strip()

        logger.info("🤖 [Gemini] Initializing Gemini Provider...")

        if not self.api_key:
            logger.error("❌ [Gemini Error] GEMINI_API_KEY is missing in environment settings.")
            raise RuntimeError("GEMINI_API_KEY is missing in environment settings.")

        genai.configure(api_key=self.api_key)
        logger.info("🔑 [Gemini] API Connected")

        # Discover & Validate Supported Models
        self.active_model_name = self._validate_and_select_model(self.configured_model_name)
        self._model = genai.GenerativeModel(self.active_model_name)
        logger.info(f"✅ [Gemini] Model Loaded: '{self.active_model_name}'")

    def _list_supported_models(self) -> List[str]:
        """Fetch all models that support generateContent."""
        try:
            models = list(genai.list_models())
            supported = []
            for m in models:
                methods = getattr(m, "supported_generation_methods", [])
                if "generateContent" in methods:
                    name = m.name
                    supported.append(name)
                    if name.startswith("models/"):
                        supported.append(name.replace("models/", ""))
            self._supported_models = sorted(list(set(supported)))
            return self._supported_models
        except Exception as exc:
            logger.warning(f"⚠️ [Gemini Warning] Unable to list models: {exc}")
            return []

    def _validate_and_select_model(self, requested_model: str) -> str:
        supported = self._list_supported_models()

        if supported:
            clean_req = requested_model.replace("models/", "")
            if clean_req in supported or f"models/{clean_req}" in supported or requested_model in supported:
                logger.info(f"🎯 [Gemini] Configured model '{requested_model}' verified in supported models.")
                return requested_model

            logger.warning(
                f"⚠️ [Gemini Warning] Configured model '{requested_model}' not found in supported models for this API key.\n"
                f"Available supported models: {supported}"
            )

            # Auto-fallback selection
            for candidate in PREFER_FALLBACK_MODELS:
                if candidate in supported or f"models/{candidate}" in supported:
                    logger.info(f"🔄 [Gemini] Auto-selected fallback model: '{candidate}'")
                    return candidate

            # Use first supported model as ultimate fallback
            first_available = supported[0]
            logger.info(f"🔄 [Gemini] Auto-selected first available supported model: '{first_available}'")
            return first_available

        logger.info(f"ℹ️ [Gemini] Model list empty or offline. Using requested model: '{requested_model}'")
        return requested_model

    async def generate_response(self, prompt: str) -> str:
        model = self._get_model()
        logger.info(f"🚀 [Gemini Request Started] Prompt length: {len(prompt)} chars")

        try:
            response = await asyncio.to_thread(model.generate_content, prompt)
            text = getattr(response, "text", None)

            if not text and hasattr(response, "candidates") and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, "content") and candidate.content.parts:
                    text = "".join(part.text for part in candidate.content.parts if hasattr(part, "text"))

        except Exception as exc:
            logger.error(f"❌ [Gemini Error] Generation failed for model '{self.active_model_name}': {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Gemini model configuration is invalid.",
                    "details": str(exc),
                    "suggestion": f"Check GEMINI_MODEL in your .env file. Currently active: '{self.active_model_name}'.",
                },
            ) from exc

        if not text:
            logger.error(f"❌ [Gemini Error] Model '{self.active_model_name}' returned an empty response.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Gemini model returned an empty response.",
                    "details": "Model completed generation but returned no text content.",
                    "suggestion": "Check prompt length or try selecting another GEMINI_MODEL in .env.",
                },
            )

        logger.info(f"📥 [Gemini Response Received] Response length: {len(text)} chars")
        return text

    async def health_check(self) -> bool:
        self._get_model()
        try:
            await asyncio.to_thread(lambda: list(genai.list_models()))
            logger.info("✅ [Gemini] API Connected")
            return True
        except Exception as exc:
            logger.error(f"❌ [Gemini Error] Health check failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Gemini health check failed.",
                    "details": str(exc),
                    "suggestion": "Verify GEMINI_API_KEY and network connection.",
                },
            ) from exc

    def _get_model(self) -> genai.GenerativeModel:
        if self._model is None:
            self.configure()
        if self._model is None:
            raise RuntimeError("Gemini client is not configured.")
        return self._model


# Shared Provider Instance
gemini_provider = GeminiProvider()
GeminiClient = GeminiProvider
gemini_client = gemini_provider


async def connect_to_gemini() -> None:
    gemini_provider.configure()
    await gemini_provider.health_check()
    logger.info("✅ Gemini API Initialized & Verified Successfully")
