from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from core.ai.llm import LLMService
import json
import asyncio

app = FastAPI(title="Spardose API", version="1.0.0")

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
    return {"message": "Spardose API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/analyze")
async def analyze_data(data: dict, stream: bool = Query(False, description="Enable streaming response")):
    """General data analysis using LLM completion"""
    try:
        if stream:
            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(data, "general_analysis"):
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return StreamingResponse(generate(), media_type="text/plain")
        else:
            result = await llm_service.general_analysis(data)
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze/position")
async def analyze_position_data(data: dict, stream: bool = Query(False, description="Enable streaming response")):
    """Analyze position data using specialized position analysis"""
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
            result = await llm_service.analyze_position_data(data)
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze/position-plans")
async def find_position_plans(data: dict, stream: bool = Query(False, description="Enable streaming response")):
    """Find and analyze position plans"""
    try:
        if stream:
            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(data, "position_plan_finder"):
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return StreamingResponse(generate(), media_type="text/plain")
        else:
            result = await llm_service.find_position_plans(data)
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze/top-earning")
async def analyze_top_earning_positions(data: dict, stream: bool = Query(False, description="Enable streaming response")):
    """Analyze top-earning positions"""
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
            result = await llm_service.analyze_top_earning_positions(data)
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat/stream")
async def chat_completion_stream(message: str):
    """Streaming chat completion endpoint"""
    async def generate():
        try:
            async for chunk in llm_service.complete_stream({"message": message}, "chat_assistant"):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/analyze/stream")
async def analyze_data_stream(data: dict):
    """Streaming general data analysis"""
    async def generate():
        try:
            async for chunk in llm_service.complete_stream(data, "general_analysis"):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/analyze/position/stream")
async def analyze_position_data_stream(data: dict):
    """Streaming position analysis"""
    async def generate():
        try:
            async for chunk in llm_service.complete_stream(data, "position_analysis"):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/analyze/position-plans/stream")
async def find_position_plans_stream(data: dict):
    """Streaming position plans analysis"""
    async def generate():
        try:
            async for chunk in llm_service.complete_stream(data, "position_plan_finder"):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/analyze/top-earning/stream")
async def analyze_top_earning_positions_stream(data: dict):
    """Streaming top-earning analysis"""
    async def generate():
        try:
            async for chunk in llm_service.complete_stream(data, "top_earning_analyzer"):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
