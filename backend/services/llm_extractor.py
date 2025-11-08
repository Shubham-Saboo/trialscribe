"""
LLM-based patient data extraction service using LangChain
"""
import os
from typing import Dict, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class PatientData(BaseModel):
    """Structured patient data extracted from transcript"""
    diagnosis: str = Field(description="Primary diagnosis or condition mentioned")
    age: Optional[int] = Field(description="Patient age if mentioned, otherwise None")
    gender: Optional[str] = Field(description="Patient gender if mentioned (Male/Female/Other), otherwise None")
    symptoms: list[str] = Field(description="List of symptoms mentioned")
    medical_history: list[str] = Field(description="Relevant medical history items")
    current_medications: list[str] = Field(description="Current medications if mentioned")
    treatment_plan: Optional[str] = Field(description="Treatment plan or recommendations if mentioned")
    exclusion_criteria: list[str] = Field(description="Any conditions or factors that would exclude patient from trials")

def extract_patient_data(transcript: str) -> Optional[Dict]:
    """
    Extract structured patient data from transcript using LLM
    
    Args:
        transcript: Patient-doctor conversation transcript
        
    Returns:
        Dictionary containing extracted patient data
    """
    try:
        # Initialize LLM
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Create output parser
        parser = PydanticOutputParser(pydantic_object=PatientData)
        
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a medical information extraction assistant. 
            Analyze the following patient-doctor conversation transcript and extract 
            relevant structured information about the patient's condition, demographics, 
            and medical history. Be thorough but only extract information that is explicitly 
            mentioned or clearly implied in the conversation.
            
            {format_instructions}"""),
            ("user", "Transcript:\n{transcript}")
        ])
        
        # Format prompt
        formatted_prompt = prompt.format_messages(
            format_instructions=parser.get_format_instructions(),
            transcript=transcript
        )
        
        # Get response from LLM
        response = llm.invoke(formatted_prompt)
        
        # Parse response
        patient_data = parser.parse(response.content)
        
        # Convert to dictionary
        return patient_data.model_dump()
        
    except Exception as e:
        print(f"Error extracting patient data: {str(e)}")
        # Fallback: return basic structure if LLM fails
        return {
            "diagnosis": "Unknown",
            "age": None,
            "gender": None,
            "symptoms": [],
            "medical_history": [],
            "current_medications": [],
            "treatment_plan": None,
            "exclusion_criteria": []
        }

