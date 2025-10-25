#!/bin/bash

# Spardose API Test Script
BASE_URL="http://localhost:8000"

echo "🚀 Testing Spardose API..."
echo "=========================="

# Test 1: Health Check
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .
echo ""

# Test 2: Root endpoint
echo "2. Testing root endpoint..."
curl -s "$BASE_URL/" | jq .
echo ""

# Test 3: Chat endpoint
echo "3. Testing chat endpoint..."
curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '"What is the best investment strategy?"' | jq .
echo ""

# Test 4: General analysis
echo "4. Testing general analysis..."
curl -s -X POST "$BASE_URL/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "TestCorp",
    "revenue": 500000,
    "expenses": 300000,
    "profit": 200000
  }' | jq .
echo ""

# Test 5: Position analysis
echo "5. Testing position analysis..."
curl -s -X POST "$BASE_URL/analyze/position" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "TEST",
    "shares": 50,
    "current_price": 100.00,
    "purchase_price": 90.00,
    "total_value": 5000,
    "unrealized_gain": 500
  }' | jq .
echo ""

echo "✅ All tests completed!"
