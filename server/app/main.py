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


# Helper functions for market data and scoring
async def get_eth_price_trend(
    client: httpx.AsyncClient
) -> Dict[str, Any]:
    """
    Get ETH price trend from CoinGecko API
    Returns: {'trend': 'bullish' or 'bearish', 'score': 0.0-1.0,
    'price_change_24h': float}
    """
    try:
        # Get ETH price data (24h, 7d changes)
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "ethereum",
            "vs_currencies": "usd",
            "include_24hr_change": "true",
            "include_7d_change": "true",
        }
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

        eth_data = data.get("ethereum", {})
        change_24h = eth_data.get("usd_24h_change", 0) or 0
        change_7d = eth_data.get("usd_7d_change", 0) or 0

        # Calculate trend score (weighted: 24h 60%, 7d 40%)
        # Normalize to -1 to 1
        trend_score = (change_24h * 0.6 + change_7d * 0.4) / 100.0
        trend_score = max(-1.0, min(1.0, trend_score))  # Clamp

        # Convert to 0-1 scale (bullish = higher score)
        # Convert -1..1 to 0..1
        normalized_score = (trend_score + 1) / 2.0

        trend = "bullish" if change_24h > 0 else "bearish"

        return {
            "trend": trend,
            "score": normalized_score,
            "price_change_24h": change_24h,
            "price_change_7d": change_7d,
        }
    except Exception as e:
        print(f"Error fetching ETH price trend: {e}")
        # Return neutral score on error
        return {
            "trend": "neutral",
            "score": 0.5,
            "price_change_24h": 0,
            "price_change_7d": 0,
        }


async def get_token_sentiment(
    client: httpx.AsyncClient, token_address: str, network: str
) -> Dict[str, Any]:
    """
    Get token sentiment based on price movement
    For now, we'll use a simple approach based on token address lookup
    Returns: {'sentiment': 'positive'/'negative'/'neutral', 'score': 0.0-1.0}
    """
    try:
        # Map common token addresses to CoinGecko IDs
        # This is a simplified approach - you may want to use a more
        # robust mapping
        token_id_map = {
            # WETH on Arbitrum
            "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "weth",
            # USDC on Arbitrum
            "0xaf88d065e77c8cc2239327c5edb3a432268e5831": "usd-coin",
            # WBTC on Arbitrum
            "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": "wrapped-bitcoin",
            # DAI on Arbitrum
            "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": "dai",
        }

        # Try to find token ID
        token_id = token_id_map.get(token_address.lower())

        if not token_id:
            # Default neutral sentiment if we can't identify the token
            return {"sentiment": "neutral", "score": 0.5}

        # Get token price data
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": token_id,
            "vs_currencies": "usd",
            "include_24hr_change": "true",
            "include_7d_change": "true",
        }
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

        token_data = data.get(token_id, {})
        change_24h = token_data.get("usd_24h_change", 0) or 0
        change_7d = token_data.get("usd_7d_change", 0) or 0

        # Calculate sentiment score (weighted: 24h 60%, 7d 40%)
        sentiment_score = (change_24h * 0.6 + change_7d * 0.4) / 100.0
        sentiment_score = max(-1.0, min(1.0, sentiment_score))

        # Convert to 0-1 scale
        normalized_score = (sentiment_score + 1) / 2.0

        if normalized_score > 0.6:
            sentiment = "positive"
        elif normalized_score < 0.4:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        return {
            "sentiment": sentiment,
            "score": normalized_score,
            "price_change_24h": change_24h,
            "price_change_7d": change_7d,
        }
    except Exception as e:
        print(f"Error fetching token sentiment for {token_address}: {e}")
        return {"sentiment": "neutral", "score": 0.5}


def calculate_age_score(age: float) -> float:
    """
    Calculate age-based score for different age ranges
    Ranges: (0.1-1), (0.1-3), (0.1-7) days
    Returns aggregated score 0.0-1.0
    """
    if age is None or age < 0:
        return 0.0

    scores = []

    # Score for 0.1-1 day range
    if 0.1 <= age <= 1.0:
        # Higher score for newer positions in this range
        # Linear from 1.0 (at 0.1) to 0.0 (at 1.0)
        score_1 = 1.0 - (age - 0.1) / 0.9
        scores.append(score_1)
    elif age < 0.1:
        scores.append(1.0)  # Very new positions get max score
    else:
        scores.append(0.0)

    # Score for 0.1-3 day range
    if 0.1 <= age <= 3.0:
        # Higher score for newer positions
        # Linear from 1.0 (at 0.1) to 0.0 (at 3.0)
        score_3 = 1.0 - (age - 0.1) / 2.9
        scores.append(score_3)
    elif age < 0.1:
        scores.append(1.0)
    else:
        scores.append(0.0)

    # Score for 0.1-7 day range
    if 0.1 <= age <= 7.0:
        # Higher score for newer positions
        # Linear from 1.0 (at 0.1) to 0.0 (at 7.0)
        score_7 = 1.0 - (age - 0.1) / 6.9
        scores.append(score_7)
    elif age < 0.1:
        scores.append(1.0)
    else:
        scores.append(0.0)

    # Aggregate scores (average with equal weights)
    if scores:
        return sum(scores) / len(scores)
    return 0.0


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

    Note: Weights are normalized to sum to 1.0 if they don't already
    """
    try:
        # Normalize weights to sum to 1.0
        total_weight = weight_apr + weight_roi + weight_volume
        if total_weight > 0:
            weight_apr /= total_weight
            weight_roi /= total_weight
            weight_volume /= total_weight
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
            print("\n=== Calling Revert API ===")
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

        # Fetch market data for scoring methods 3 and 4
        async with httpx.AsyncClient() as client:
            # Get ETH price trend (for score 4)
            eth_trend = await get_eth_price_trend(client)

            # Get token sentiment for both tokens (for score 3)
            # We'll use the average sentiment of both tokens in the pair
            token1_sentiment = await get_token_sentiment(
                client, token1, network
            )
            token2_sentiment = await get_token_sentiment(
                client, token2, network
            )
            # Average sentiment for the pair
            pair_sentiment_score = (
                token1_sentiment["score"] + token2_sentiment["score"]
            ) / 2.0

        # Calculate Score 1: Current scoring method (APR, ROI, Volume)
        def calculate_score_1(
            position: Dict[str, Any], all_positions: list
        ) -> float:
            """Calculate Score 1: Current weighted score (APR, ROI, Volume)"""
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

            # Normalize values using max values from dataset
            apr_list = []
            for p in all_positions:
                hodl_apr = 0
                if "performance" in p and "hodl" in p["performance"]:
                    hodl = p["performance"]["hodl"]
                    hodl_apr = float(hodl.get("apr", 0) or 0)
                apr_list.append(hodl_apr)

            apr_list = apr_list or [1]
            max_apr = max(apr_list) if apr_list else 1

            roi_list = []
            for p in all_positions:
                hodl_roi = 0
                if "performance" in p and "hodl" in p["performance"]:
                    hodl = p["performance"]["hodl"]
                    hodl_roi = float(hodl.get("roi", 0) or 0)
                roi_list.append(hodl_roi)

            roi_list = roi_list or [1]
            max_roi = max(roi_list) if roi_list else 1

            volume_list = [
                float(p.get("underlying_value", 0) or 0) for p in all_positions
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

        # Calculate Score 2: Age-based ranking
        def calculate_score_2(position: Dict[str, Any]) -> float:
            """Calculate Score 2: Aggregated age-based ranking"""
            age = position.get("age")
            if age is None:
                return 0.0
            return calculate_age_score(float(age))

        # Calculate Score 3: Market sentiment for swap pair
        def calculate_score_3() -> float:
            """Calculate Score 3: Current market trends
            (sentiment analysis) for swap pair"""
            return pair_sentiment_score

        # Calculate Score 4: ETH price signal
        def calculate_score_4() -> float:
            """Calculate Score 4: ETH market price trend (bullish/bearish)"""
            return eth_trend["score"]

        # Calculate all 4 scores for each position and combine them
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

            # Calculate all 4 scores
            # Current method (APR, ROI, Volume)
            score_1 = calculate_score_1(position, positions)
            score_2 = calculate_score_2(position)  # Age-based ranking
            # Market sentiment (same for all positions in pair)
            score_3 = calculate_score_3()
            # ETH price signal (same for all positions)
            score_4 = calculate_score_4()

            # Store individual scores
            enriched_pos["score_1"] = score_1  # Current scoring method
            enriched_pos["score_2"] = score_2  # Age-based ranking
            enriched_pos["score_3"] = score_3  # Market sentiment
            enriched_pos["score_4"] = score_4  # ETH price signal

            # Combine all scores with equal weights (0.25 each)
            # You can adjust these weights if needed
            final_score = (
                (score_1 * 0.25)
                + (score_2 * 0.25)
                + (score_3 * 0.25)
                + (score_4 * 0.25)
            )

            enriched_pos["weighted_score"] = final_score
            enriched_positions.append(enriched_pos)

        # Create 4 separate ranked lists (one for each score type)
        ranked_by_score_1 = sorted(
            enriched_positions,
            key=lambda x: x["score_1"],
            reverse=True,
        )
        ranked_by_score_2 = sorted(
            enriched_positions,
            key=lambda x: x["score_2"],
            reverse=True,
        )
        ranked_by_score_3 = sorted(
            enriched_positions,
            key=lambda x: x["score_3"],
            reverse=True,
        )
        ranked_by_score_4 = sorted(
            enriched_positions,
            key=lambda x: x["score_4"],
            reverse=True,
        )

        # Sort by final weighted score (aggregated)
        ranked_by_weighted = sorted(
            enriched_positions,
            key=lambda x: x["weighted_score"],
            reverse=True,
        )

        # Get total count from API response
        total_count = data.get("total_count", len(enriched_positions))

        # Debug: Verify rankings are created
        print(
            f"Created {len(ranked_by_score_1)} positions for score_1_ranking"
        )
        print(
            f"Created {len(ranked_by_score_2)} positions for score_2_ranking"
        )
        print(
            f"Created {len(ranked_by_score_3)} positions for score_3_ranking"
        )
        print(
            f"Created {len(ranked_by_score_4)} positions for score_4_ranking"
        )
        print(
            f"Created {len(ranked_by_weighted)} positions "
            f"for aggregated_ranking"
        )

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
            "scoring_methods": {
                "score_1": "Current method (APR, ROI, Volume)",
                "score_2": "Age-based ranking (0.1-1, 0.1-3, 0.1-7 days)",
                "score_3": (
                    f"Market sentiment (pair average: "
                    f"{token1_sentiment['sentiment']}/"
                    f"{token2_sentiment['sentiment']})"
                ),
                "score_4": f"ETH price signal ({eth_trend['trend']})",
            },
            "market_data": {
                "eth_trend": eth_trend,
                "token1_sentiment": token1_sentiment,
                "token2_sentiment": token2_sentiment,
            },
            "total_positions": total_count,
            "rankings": {
                "score_1_ranking": {
                    "description": "Current method (APR, ROI, Volume)",
                    "positions": ranked_by_score_1[:limit],
                },
                "score_2_ranking": {
                    "description": (
                        "Age-based ranking (0.1-1, 0.1-3, 0.1-7 days)"
                    ),
                    "positions": ranked_by_score_2[:limit],
                },
                "score_3_ranking": {
                    "description": (
                        f"Market sentiment (pair average: "
                        f"{token1_sentiment['sentiment']}/"
                        f"{token2_sentiment['sentiment']})"
                    ),
                    "positions": ranked_by_score_3[:limit],
                },
                "score_4_ranking": {
                    "description": f"ETH price signal ({eth_trend['trend']})",
                    "positions": ranked_by_score_4[:limit],
                },
                "aggregated_ranking": {
                    "description": (
                        "Aggregated weighted score "
                        "(equal weights: 0.25 each)"
                    ),
                    "positions": ranked_by_weighted[:limit],
                },
            },
            # Keep backward compatibility - return aggregated as main positions
            "position_recommendations": ranked_by_weighted[:limit],
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
