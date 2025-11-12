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
    Uses raw_data if available to provide comprehensive information.
    
    Args:
        trial: ClinicalTrial model instance
        
    Returns:
        Formatted context string
    """
    # If raw_data is available, extract comprehensive information from it
    if trial.raw_data:
        return _format_trial_context_from_raw(trial.raw_data)
    
    # Fallback to basic ClinicalTrial fields if raw_data not available
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


def _format_trial_context_from_raw(raw_study: Dict) -> str:
    """
    Format comprehensive trial context from raw API response.
    
    Args:
        raw_study: Full raw study dictionary from API
        
    Returns:
        Formatted context string with all available trial information
    """
    context_parts = []
    
    # Extract protocol section
    protocol = raw_study.get("protocolSection", {})
    
    # Identification Module
    ident = protocol.get("identificationModule", {})
    context_parts.append(f"NCT ID: {ident.get('nctId', 'N/A')}")
    context_parts.append(f"Title: {ident.get('briefTitle', 'No title available')}")
    if ident.get("officialTitle"):
        context_parts.append(f"Official Title: {ident.get('officialTitle')}")
    
    # Status Module - includes dates
    status = protocol.get("statusModule", {})
    context_parts.append(f"\nStatus: {status.get('overallStatus', 'Unknown')}")
    
    # Start and completion dates
    start_date = status.get("startDateStruct", {})
    if start_date.get("date"):
        context_parts.append(f"Start Date: {start_date.get('date')} ({start_date.get('type', 'Unknown')})")
    
    primary_completion = status.get("primaryCompletionDateStruct", {})
    if primary_completion.get("date"):
        context_parts.append(f"Primary Completion Date: {primary_completion.get('date')} ({primary_completion.get('type', 'Unknown')})")
    
    completion = status.get("completionDateStruct", {})
    if completion.get("date"):
        context_parts.append(f"Completion Date: {completion.get('date')} ({completion.get('type', 'Unknown')})")
    
    # Sponsor Information
    sponsor_module = protocol.get("sponsorCollaboratorsModule", {})
    if sponsor_module:
        lead_sponsor = sponsor_module.get("leadSponsor", {})
        if lead_sponsor.get("name"):
            context_parts.append(f"\nLead Sponsor: {lead_sponsor.get('name')}")
        collaborators = sponsor_module.get("collaborators", [])
        if collaborators:
            collaborator_names = [c.get("name", "") for c in collaborators if c.get("name")]
            if collaborator_names:
                context_parts.append(f"Collaborators: {', '.join(collaborator_names)}")
    
    # Design Module
    design = protocol.get("designModule", {})
    if design:
        context_parts.append(f"\nStudy Type: {design.get('studyType', 'Unknown')}")
        phases = design.get("phases", [])
        if phases:
            context_parts.append(f"Phase: {', '.join(phases)}")
        design_info = design.get("designInfo", {})
        if design_info:
            if design_info.get("allocation"):
                context_parts.append(f"Allocation: {design_info.get('allocation')}")
            if design_info.get("interventionModel"):
                context_parts.append(f"Intervention Model: {design_info.get('interventionModel')}")
            if design_info.get("primaryPurpose"):
                context_parts.append(f"Primary Purpose: {design_info.get('primaryPurpose')}")
        enrollment = design.get("enrollmentInfo", {})
        if enrollment.get("count"):
            context_parts.append(f"Enrollment: {enrollment.get('count')} ({enrollment.get('type', 'Unknown')})")
    
    # Conditions
    conditions_module = protocol.get("conditionsModule", {})
    if conditions_module.get("conditions"):
        context_parts.append(f"\nConditions: {', '.join(conditions_module.get('conditions', []))}")
    
    # Description Module
    description = protocol.get("descriptionModule", {})
    if description.get("briefSummary"):
        context_parts.append(f"\nBrief Summary:\n{description.get('briefSummary')}")
    if description.get("detailedDescription"):
        context_parts.append(f"\nDetailed Description:\n{description.get('detailedDescription')}")
    
    # Eligibility Module
    eligibility = protocol.get("eligibilityModule", {})
    if eligibility:
        if eligibility.get("eligibilityCriteria"):
            context_parts.append(f"\nEligibility Criteria:\n{eligibility.get('eligibilityCriteria')}")
        if eligibility.get("sex"):
            context_parts.append(f"Gender: {eligibility.get('sex')}")
        if eligibility.get("minimumAge"):
            context_parts.append(f"Minimum Age: {eligibility.get('minimumAge')}")
        if eligibility.get("maximumAge"):
            context_parts.append(f"Maximum Age: {eligibility.get('maximumAge')}")
    
    # Arms and Interventions
    arms_interventions = protocol.get("armsInterventionsModule", {})
    if arms_interventions:
        interventions = arms_interventions.get("interventions", [])
        if interventions:
            context_parts.append("\nInterventions:")
            for interv in interventions:
                interv_name = interv.get("name", "Unknown")
                interv_type = interv.get("type", "")
                interv_desc = interv.get("description", "")
                context_parts.append(f"- {interv_name} ({interv_type})")
                if interv_desc:
                    context_parts.append(f"  Description: {interv_desc}")
        
        arm_groups = arms_interventions.get("armGroups", [])
        if arm_groups:
            context_parts.append("\nStudy Arms:")
            for arm in arm_groups:
                arm_label = arm.get("label", "Unknown")
                arm_type = arm.get("type", "")
                arm_desc = arm.get("description", "")
                context_parts.append(f"- {arm_label} ({arm_type})")
                if arm_desc:
                    context_parts.append(f"  Description: {arm_desc}")
    
    # Contacts and Locations
    contacts_locations = protocol.get("contactsLocationsModule", {})
    if contacts_locations:
        central_contacts = contacts_locations.get("centralContacts", [])
        if central_contacts:
            context_parts.append("\nCentral Contacts:")
            for contact in central_contacts:
                contact_name = contact.get("name", "")
                contact_role = contact.get("role", "")
                contact_phone = contact.get("phone", "")
                contact_email = contact.get("email", "")
                contact_info = f"- {contact_name}"
                if contact_role:
                    contact_info += f" ({contact_role})"
                if contact_phone:
                    contact_info += f" | Phone: {contact_phone}"
                if contact_email:
                    contact_info += f" | Email: {contact_email}"
                context_parts.append(contact_info)
        
        locations = contacts_locations.get("locations", [])
        if locations:
            context_parts.append("\nLocations:")
            for loc in locations:
                loc_parts = []
                if loc.get("facility"):
                    loc_parts.append(loc.get("facility"))
                if loc.get("city"):
                    loc_parts.append(loc.get("city"))
                if loc.get("state"):
                    loc_parts.append(loc.get("state"))
                if loc.get("zip"):
                    loc_parts.append(loc.get("zip"))
                if loc.get("country"):
                    loc_parts.append(loc.get("country"))
                if loc.get("status"):
                    loc_parts.append(f"[{loc.get('status')}]")
                if loc_parts:
                    context_parts.append(f"- {', '.join(loc_parts)}")
    
    # Outcomes (if available)
    outcomes_module = protocol.get("outcomesModule", {})
    if outcomes_module:
        primary_outcomes = outcomes_module.get("primaryOutcomes", [])
        if primary_outcomes:
            context_parts.append("\nPrimary Outcomes:")
            for outcome in primary_outcomes:
                outcome_measure = outcome.get("measure", "")
                outcome_desc = outcome.get("description", "")
                outcome_time = outcome.get("timeFrame", "")
                outcome_info = f"- {outcome_measure}"
                if outcome_desc:
                    outcome_info += f": {outcome_desc}"
                if outcome_time:
                    outcome_info += f" (Time Frame: {outcome_time})"
                context_parts.append(outcome_info)
    
    # Trial URL
    nct_id = ident.get("nctId", "N/A")
    context_parts.append(f"\nTrial URL: https://clinicaltrials.gov/study/{nct_id}")
    
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

