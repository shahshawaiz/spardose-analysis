from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from core.ai.llm import LLMService
import json
import asyncio

app = FastAPI(title="Spardose Analytics API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM service
llm_service = LLMService()

@app.get("/")
async def root():
    return {"message": "Spardose Analytics API", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/analyze/position")
async def analyze_position(data: dict, stream: bool = Query(True, description="Enable streaming response")):
    """Analyze position data and provide insights"""
    try:
        if stream:
            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(data, "position_analysis"):
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return StreamingResponse(generate(), media_type="text/plain")
        else:
            result = await llm_service.complete(data, "position_analysis")
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze/top-earning")
async def analyze_top_earning(data: dict, stream: bool = Query(True, description="Enable streaming response")):
    """Analyze top earning positions from wallet pool data"""
    try:
        if stream:
            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(data, "top_earning_analyzer"):
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return StreamingResponse(generate(), media_type="text/plain")
        else:
            result = await llm_service.complete(data, "top_earning_analyzer")
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat")
async def chat(data: dict, stream: bool = Query(True, description="Enable streaming response")):
    """Chat with AI assistant for general DeFi questions"""
    try:
        if stream:
            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(data, "chat_assistant"):
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return StreamingResponse(generate(), media_type="text/plain")
        else:
            result = await llm_service.complete(data, "chat_assistant")
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
