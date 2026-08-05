from typing import Protocol

from app.core.gemini import gemini_client


class LLMProvider(Protocol):
    async def generate_response(self, prompt: str) -> str:
        ...

    async def health_check(self) -> bool:
        ...


class LLMClient:
    def __init__(self, provider: LLMProvider, provider_name: str) -> None:
        self.provider = provider
        self.provider_name = provider_name

    async def generate_text(self, prompt: str) -> str:
        return await self.provider.generate_response(prompt)

    async def health_check(self) -> bool:
        return await self.provider.health_check()


llm_client = LLMClient(provider=gemini_client, provider_name="gemini")


def get_llm_client() -> LLMClient:
    return llm_client
