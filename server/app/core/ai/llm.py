import os
import json
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMService:
    def __init__(self):
        """Initialize the LLM service with OpenAI client"""
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
        
    async def complete(self, data: Dict[str, Any], system_prompt_file: Optional[str] = None) -> str:
        """
        Complete a task using LLM with provided data and system prompt
        
        Args:
            data: Input data for the completion
            system_prompt_file: Optional system prompt file name (without .txt extension)
            
        Returns:
            LLM completion result
        """
        try:
            # Load system prompt if provided
            if system_prompt_file:
                system_prompt = self.load_prompt_from_file(f"{system_prompt_file}.txt")
            else:
                system_prompt = self._load_default_system_prompt()
            
            # Format user message with data
            user_message = self._format_user_message(data)
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"LLM completion failed: {str(e)}")
    
    async def complete_stream(self, data: Dict[str, Any], system_prompt_file: Optional[str] = None):
        """
        Complete a task using LLM with streaming response
        
        Args:
            data: Input data for the completion
            system_prompt_file: Optional system prompt file name (without .txt extension)
            
        Yields:
            Streaming chunks of the completion
        """
        try:
            # Load system prompt if provided
            if system_prompt_file:
                system_prompt = self.load_prompt_from_file(f"{system_prompt_file}.txt")
            else:
                system_prompt = self._load_default_system_prompt()
            
            # Format user message with data
            user_message = self._format_user_message(data)
            
            # Call OpenAI API with streaming
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=1500,
                temperature=0.7,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"
    
    async def chat_complete(self, message: str) -> str:
        """
        Simple chat completion using chat assistant system prompt
        
        Args:
            message: User message
            
        Returns:
            AI response
        """
        try:
            system_prompt = self.load_prompt_from_file("chat_assistant.txt")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Chat completion failed: {str(e)}")
    
    async def analyze_position_data(self, position_data: Dict[str, Any]) -> str:
        """
        Analyze position data using position analysis system prompt
        
        Args:
            position_data: Position data to analyze
            
        Returns:
            Analysis result
        """
        return await self.complete(position_data, "position_analysis")
    
    async def find_position_plans(self, data: Dict[str, Any]) -> str:
        """
        Find and analyze position plans using specialized system prompt
        
        Args:
            data: Data containing position plan information
            
        Returns:
            Position plan analysis result
        """
        return await self.complete(data, "position_plan_finder")
    
    async def analyze_top_earning_positions(self, data: Dict[str, Any]) -> str:
        """
        Analyze top-earning positions using specialized system prompt
        
        Args:
            data: Data containing position earning information
            
        Returns:
            Top earning position analysis result
        """
        return await self.complete(data, "top_earning_analyzer")
    
    async def general_analysis(self, data: Dict[str, Any]) -> str:
        """
        Perform general data analysis using general analysis system prompt
        
        Args:
            data: Data to analyze
            
        Returns:
            General analysis result
        """
        return await self.complete(data, "general_analysis")
    
    def _load_default_system_prompt(self) -> str:
        """Load default system prompt"""
        return "You are a helpful AI assistant specializing in data analysis and financial insights."
    
    def _format_user_message(self, data: Dict[str, Any]) -> str:
        """Format user message with data"""
        try:
            return f"Please analyze the following data:\n\n{json.dumps(data, indent=2)}"
        except Exception as e:
            return f"Please analyze the following data:\n\n{str(data)}"
    
    def load_prompt_from_file(self, prompt_file: str) -> str:
        """
        Load a prompt template from a file in the prompts directory
        
        Args:
            prompt_file: Name of the prompt file
            
        Returns:
            Prompt template content
        """
        try:
            prompts_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "prompts")
            prompt_path = os.path.join(prompts_dir, prompt_file)
            
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read()
                
        except FileNotFoundError:
            raise Exception(f"Prompt file {prompt_file} not found in prompts directory")
        except Exception as e:
            raise Exception(f"Error loading prompt file: {str(e)}")
