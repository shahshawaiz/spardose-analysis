#!/bin/bash

# Test script for the new position recommendations API

BASE_URL="http://localhost:8000"

echo "Testing Position Recommendations API..."
echo ""

# Test with WETH/USDC on Arbitrum
echo "Test 1: WETH/USDC on Arbitrum (UniswapV3)"
TOKEN0="0x82af49447d8a07e3bd95bd0d56f35241523fbab1"  # WETH
TOKEN1="0xaf88d065e77c8cc2239327c5edb3a432268e5831"  # USDC
NETWORK="arbitrum"
EXCHANGE="uniswapv3"

curl -X GET "${BASE_URL}/positions/recommendations?token1=${TOKEN0}&token2=${TOKEN1}&network=${NETWORK}&exchange=${EXCHANGE}&limit=5" \
  | python3 -m json.tool

echo ""
echo "---"
echo ""
echo "Test 2: With custom weights (higher priority on ROI)"
curl -X GET "${BASE_URL}/positions/recommendations?token1=${TOKEN0}&token2=${TOKEN1}&network=${NETWORK}&exchange=${EXCHANGE}&limit=5&weight_apr=0.2&weight_roi=0.7&weight_volume=0.1" \
  | python3 -m json.tool

