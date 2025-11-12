"""
LLM client factory for creating reusable LangChain clients
"""
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel
from config import Config
from services.logger import get_logger

logger = get_logger("llm_client")


def create_llm_client(
    model: str = None,
    temperature: float = None,
    api_key: str = None
) -> BaseChatModel:
    """
    Create a LangChain OpenAI LLM client
    
    Args:
        model: Model name (defaults to Config.OPENAI_MODEL)
        temperature: Temperature setting (defaults to Config.OPENAI_TEMPERATURE)
        api_key: OpenAI API key (defaults to Config.OPENAI_API_KEY)
        
    Returns:
        Configured ChatOpenAI instance
        
    Raises:
        ValueError: If API key is not configured
    """
    api_key = api_key or Config.OPENAI_API_KEY
    if not api_key:
        raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
    
    model = model or Config.OPENAI_MODEL
    temperature = temperature if temperature is not None else Config.OPENAI_TEMPERATURE
    
    logger.debug(f"Creating LLM client with model: {model}, temperature: {temperature}")
    
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        api_key=api_key
    )

