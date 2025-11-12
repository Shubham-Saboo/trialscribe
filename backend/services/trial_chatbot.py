"""
Trial-specific Q&A chatbot service using LangChain
Reuses the existing llm_client for consistency
"""
from typing import List, Dict
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from services.llm_client import create_llm_client
from services.models import ClinicalTrial
from services.exceptions import TrialScribeException
from services.logger import get_logger

logger = get_logger("trial_chatbot")

# System prompt for trial Q&A chatbot
TRIAL_CHATBOT_SYSTEM_PROMPT = """You are a helpful medical assistant specializing in clinical trials. 
Your role is to answer questions about a specific clinical trial based on the trial information provided.

CRITICAL RULES:
1. Answer questions ONLY based on the trial information provided in the context
2. If information is not available in the context, clearly state "This information is not available in the trial details"
3. Provide clear, patient-friendly explanations
4. Avoid medical advice beyond explaining trial details
5. Encourage patients to consult with their healthcare provider for medical decisions
6. Be empathetic and supportive
7. If asked about eligibility, reference the eligibility criteria provided
8. If asked about location, reference the trial locations provided

Trial Context:
{trial_context}

Remember: You are helping patients understand this specific clinical trial. Be clear, accurate, and helpful."""


def format_trial_context(trial: ClinicalTrial) -> str:
    """
    Format trial information into a context string for the chatbot.
    
    Args:
        trial: ClinicalTrial model instance
        
    Returns:
        Formatted context string
    """
    context_parts = [
        f"NCT ID: {trial.nct_id}",
        f"Title: {trial.title}",
    ]
    
    if trial.official_title:
        context_parts.append(f"Official Title: {trial.official_title}")
    
    context_parts.append(f"Status: {trial.status}")
    
    if trial.phase:
        context_parts.append(f"Phase: {', '.join(trial.phase)}")
    
    if trial.conditions:
        context_parts.append(f"Conditions: {', '.join(trial.conditions)}")
    
    if trial.summary:
        context_parts.append(f"\nSummary:\n{trial.summary}")
    
    if trial.eligibility_criteria:
        context_parts.append(f"\nEligibility Criteria:\n{trial.eligibility_criteria}")
    
    if trial.locations:
        context_parts.append(f"\nLocations:\n" + "\n".join(f"- {loc}" for loc in trial.locations))
    
    context_parts.append(f"\nTrial URL: {trial.url}")
    
    return "\n".join(context_parts)


def chat_about_trial(
    trial: ClinicalTrial,
    question: str,
    chat_history: List[Dict[str, str]] = None
) -> str:
    """
    Answer a question about a specific clinical trial using the existing LLM client.
    
    Args:
        trial: ClinicalTrial model instance
        question: User's question
        chat_history: Previous conversation messages in format [{"role": "user/assistant", "content": "..."}]
        
    Returns:
        AI's response as a string
        
    Raises:
        TrialScribeException: If chat fails
    """
    if not question or not question.strip():
        raise ValueError("Question cannot be empty")
    
    try:
        logger.info(f"Processing trial chat question for NCT ID: {trial.nct_id}")
        
        # Reuse existing LLM client - can customize temperature for more conversational responses
        llm = create_llm_client(temperature=0.3)  # Slightly higher than extraction (0) for natural conversation
        
        # Format trial context
        trial_context = format_trial_context(trial)
        
        # Create prompt template with system message and conversation history
        prompt = ChatPromptTemplate.from_messages([
            ("system", TRIAL_CHATBOT_SYSTEM_PROMPT.format(trial_context=trial_context)),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}")
        ])
        
        # Convert chat history to LangChain message format
        langchain_messages = []
        if chat_history:
            for msg in chat_history:
                role = msg.get("role", "").lower()
                content = msg.get("content", "")
                if role == "user":
                    langchain_messages.append(HumanMessage(content=content))
                elif role == "assistant":
                    langchain_messages.append(AIMessage(content=content))
        
        # Create chain: prompt -> llm
        chain = prompt | llm
        
        # Invoke chain with conversation history and current question
        response = chain.invoke({
            "chat_history": langchain_messages,
            "question": question
        })
        
        # Extract content from response
        if hasattr(response, 'content'):
            answer = response.content
        else:
            answer = str(response)
        
        logger.info(f"Generated response for trial {trial.nct_id}: {len(answer)} chars")
        return answer
        
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Error in trial chatbot: {str(e)}", exc_info=True)
        raise TrialScribeException(f"Failed to process chat question: {str(e)}") from e

