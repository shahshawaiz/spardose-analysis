from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from core.ai.llm import LLMService
import json
import httpx
from typing import Dict, Any

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
async def analyze_position(
    data: dict,
    stream: bool = Query(True, description="Enable streaming response"),
):
    """Analyze position data and provide insights"""
    try:
        if stream:

            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(
                        data, "position_analysis"
                    ):
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
async def analyze_top_earning(
    data: dict,
    stream: bool = Query(True, description="Enable streaming response"),
):
    """Analyze top earning positions from wallet pool data"""
    try:
        if stream:

            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(
                        data, "top_earning_analyzer"
                    ):
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
async def chat(
    data: dict,
    stream: bool = Query(True, description="Enable streaming response"),
):
    """Chat with AI assistant for general DeFi questions"""
    try:
        if stream:

            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(
                        data, "chat_assistant"
                    ):
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            return StreamingResponse(generate(), media_type="text/plain")
        else:
            result = await llm_service.complete(data, "chat_assistant")
            return {"result": result}
    except Exception as e:
        return {"error": str(e)}


@app.get("/positions/recommendations")
async def get_position_recommendations(
    token1: str = Query(..., description="Address of token 1"),
    token2: str = Query(..., description="Address of token 2"),
    network: str = Query(
        ..., description="Blockchain network (e.g., arbitrum, ethereum)"
    ),
    exchange: str = Query(..., description="DEX exchange (e.g., uniswapv3)"),
    limit: int = Query(100, description="Max positions to return"),
    weight_apr: float = Query(
        0.4, description="Weight for APR in scoring (default: 0.4)"
    ),
    weight_roi: float = Query(
        0.4, description="Weight for ROI in scoring (default: 0.4)"
    ),
    weight_volume: float = Query(
        0.2, description="Weight for volume in scoring (default: 0.2)"
    ),
    age_from: float = Query(0.1, description="Min age in days (default: 0.1)"),
    age_to: float = Query(1.0, description="Max age in days (default: 1.0)"),
):
    """
    Get position recommendations from Revert API with weighted scoring

    Parameters:
    - token1: Address of first token
      (e.g., 0x82af49447d8a07e3bd95bd0d56f35241523fbab1)
    - token2: Address of second token
      (e.g., 0xaf88d065e77c8cc2239327c5edb3a432268e5831)
    - network: Blockchain network (arbitrum, ethereum, etc.)
    - exchange: DEX exchange (uniswapv3, etc.)
    - limit: Maximum number of positions to return
    - weight_apr: Weight for APR in scoring (0.0-1.0)
    - weight_roi: Weight for ROI in scoring (0.0-1.0)
    - weight_volume: Weight for volume in scoring (0.0-1.0)

    Returns top positions sorted by weighted score of APR%, ROI%, and volume
    """
    try:
        # Build Revert API URL
        # Format based on working Revert API example:
        # https://api.revert.finance/v1/positions?offset=0&sort=apr
        # &limit=50&network=arbitrum&with-v4=true
        # IMPORTANT: Revert API is case-sensitive - use lowercase
        base_url = "https://api.revert.finance/v1/positions"
        params = {
            "offset": 0,
            "sort": "apr",
            "limit": limit,
            "network": network,
            "with-v4": "true",
            "token0": token1.lower(),  # Convert to lowercase
            "no-withdrawals": "true",
            "desc": "true",
            "exchange": exchange,
            "page": 1,
            "token1": token2.lower(),  # Convert to lowercase
            "age-from": age_from,
            "age-to": age_to,
        }

        # Fetch positions
        async with httpx.AsyncClient() as client:
            print(f"\n=== Calling Revert API ===")
            print(f"URL: {base_url}")
            print(f"Params: {params}")
            response = await client.get(base_url, params=params)
            print(f"Response status: {response.status_code}")
            response.raise_for_status()
            data = response.json()

        # Log response for debugging
        import json as json_lib

        response_str = json_lib.dumps(data, indent=2)[:1000]
        print(f"Revert API Response (first 1000 chars):\n{response_str}...")
        print(f"\nTotal count from API: {data.get('total_count', 'N/A')}")
        print(f"Success: {data.get('success', 'N/A')}")

        # Extract positions from response
        # Revert API returns 'data' field, not 'positions'
        positions = data.get("data", data.get("positions", []))
        print(f"Extracted {len(positions)} positions")
        if not positions:
            return {
                "token0": token1,
                "token1": token2,
                "network": network,
                "exchange": exchange,
                "positions": [],
                "message": "No positions found",
            }

        # Calculate weighted scores for each position
        def calculate_score(position: Dict[str, Any]) -> float:
            """Calculate weighted score for a position"""
            # Revert API structure: performance.hodl.apr, performance.hodl.roi
            apr = 0
            roi = 0
            volume = 0

            # Extract from performance.hodl object
            if "performance" in position and "hodl" in position["performance"]:
                hodl = position["performance"]["hodl"]
                if "apr" in hodl:
                    apr = float(hodl["apr"] or 0)
                if "roi" in hodl:
                    roi = float(hodl["roi"] or 0)

            # Try volume from underlying_value
            if "underlying_value" in position:
                volume = float(position["underlying_value"] or 0)

            # Normalize values (simple min-max normalization)
            # We'll use the maximum values from the dataset for normalization
            apr_list = []
            for p in positions:
                hodl_apr = 0
                if "performance" in p and "hodl" in p["performance"]:
                    hodl = p["performance"]["hodl"]
                    hodl_apr = float(hodl.get("apr", 0) or 0)
                apr_list.append(hodl_apr)

            apr_list = apr_list or [1]
            max_apr = max(apr_list) if apr_list else 1

            roi_list = []
            for p in positions:
                hodl_roi = 0
                if "performance" in p and "hodl" in p["performance"]:
                    hodl = p["performance"]["hodl"]
                    hodl_roi = float(hodl.get("roi", 0) or 0)
                roi_list.append(hodl_roi)

            roi_list = roi_list or [1]
            max_roi = max(roi_list) if roi_list else 1

            volume_list = [
                float(p.get("underlying_value", 0) or 0) for p in positions
            ] or [1]
            max_volume = max(volume_list) if volume_list else 1

            # Normalize to 0-1 scale
            norm_apr = apr / max_apr if max_apr > 0 else 0
            norm_roi = roi / max_roi if max_roi > 0 else 0
            norm_volume = volume / max_volume if max_volume > 0 else 0

            # Calculate weighted score
            score = (
                (weight_apr * norm_apr)
                + (weight_roi * norm_roi)
                + (weight_volume * norm_volume)
            )
            return score

        # Add scores and sort by weighted score
        enriched_positions = []
        for position in positions:
            # Create a clean enriched position with extracted data
            enriched_pos = {
                "nft_id": position.get("nft_id"),
                "pool": position.get("pool"),
                "in_range": position.get("in_range"),
                "age": position.get("age"),
                "tick_lower": position.get("tick_lower"),
                "tick_upper": position.get("tick_upper"),
                "fee_tier": position.get("fee_tier"),
                "network": position.get("network"),
                "exchange": position.get("exchange"),
                "token0": position.get("token0"),
                "token1": position.get("token1"),
                "tokens": position.get("tokens", {}),
            }

            # Extract performance metrics
            if "performance" in position and "hodl" in position["performance"]:
                hodl = position["performance"]["hodl"]
                enriched_pos["apr"] = float(hodl.get("apr", 0) or 0)
                enriched_pos["roi"] = float(hodl.get("roi", 0) or 0)
                enriched_pos["pnl"] = float(hodl.get("pnl", 0) or 0)
                enriched_pos["pool_apr"] = float(hodl.get("pool_apr", 0) or 0)
                enriched_pos["fee_apr"] = float(hodl.get("fee_apr", 0) or 0)

            # Add underlying value
            if "underlying_value" in position:
                enriched_pos["underlying_value"] = float(
                    position["underlying_value"] or 0
                )

            score = calculate_score(position)
            enriched_pos["weighted_score"] = score
            enriched_positions.append(enriched_pos)

        # Sort by weighted score (descending)
        sorted_positions = sorted(
            enriched_positions,
            key=lambda x: x["weighted_score"],
            reverse=True,
        )

        # Get total count from API response
        total_count = data.get("total_count", len(sorted_positions))

        return {
            "token0": token1,
            "token1": token2,
            "network": network,
            "exchange": exchange,
            "scoring_weights": {
                "apr": weight_apr,
                "roi": weight_roi,
                "volume": weight_volume,
            },
            "total_positions": total_count,
            "positions": sorted_positions[:limit],
        }

    except httpx.HTTPError as e:
        return {"error": f"HTTP error when calling Revert API: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}


@app.post("/positions/recommendations/analyze")
async def analyze_positions(data: dict, stream: bool = Query(False)):
    """
    Analyze position recommendations using LLM

    Parameters:
    - data: Should contain 'positions' array with position data
    - stream: Whether to stream the response
    """
    try:
        # Check if it's a single position or array
        if "position" in data:
            # Single position analysis
            position = data.get("position")
            network = data.get("network", "unknown")
            exchange = data.get("exchange", "unknown")
            token0 = data.get("token0", "")
            token1 = data.get("token1", "")

            if not position:
                return {"error": "No position provided"}

            analysis_data = {
                "network": network,
                "exchange": exchange,
                "token0": token0,
                "token1": token1,
                "position": position,
            }
        else:
            # Multiple positions analysis
            positions = data.get("positions", [])
            network = data.get("network", "unknown")
            exchange = data.get("exchange", "unknown")
            token0 = data.get("token0", "")
            token1 = data.get("token1", "")

            if not positions:
                return {"error": "No positions provided"}

            # Prepare analysis data
            analysis_data = {
                "network": network,
                "exchange": exchange,
                "token0": token0,
                "token1": token1,
                "total_positions": len(positions),
                "positions": positions[:10],  # Top 10 only
            }

        if stream:

            async def generate():
                try:
                    async for chunk in llm_service.complete_stream(
                        analysis_data, "position_analysis"
                    ):
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            return StreamingResponse(generate(), media_type="text/plain")
        else:
            result = await llm_service.complete(
                analysis_data, "position_analysis"
            )
            return {"result": result}

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
