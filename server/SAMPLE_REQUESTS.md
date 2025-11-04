# Sample API Requests

## Get Position Recommendations

### Basic Request (WETH/USDC on Arbitrum)

```bash
curl "http://localhost:8000/positions/recommendations?token1=0x82af49447d8a07e3bd95bd0d56f35241523fbab1&token2=0xaf88d065e77c8cc2239327c5edb3a432268e5831&network=arbitrum&exchange=uniswapv3&limit=10"
```

### With Custom Scoring Weights

```bash
curl "http://localhost:8000/positions/recommendations?token1=0x82af49447d8a07e3bd95bd0d56f35241523fbab1&token2=0xaf88d065e77c8cc2239327c5edb3a432268e5831&network=arbitrum&exchange=uniswapv3&limit=10&weight_apr=0.5&weight_roi=0.3&weight_volume=0.2"
```

### With Age Filter

```bash
curl "http://localhost:8000/positions/recommendations?token1=0x82af49447d8a07e3bd95bd0d56f35241523fbab1&token2=0xaf88d065e77c8cc2239327c5edb3a432268e5831&network=arbitrum&exchange=uniswapv3&limit=10&age_from=0.1&age_to=3.0"
```

### Formatted JSON Output

```bash
curl "http://localhost:8000/positions/recommendations?token1=0x82af49447d8a07e3bd95bd0d56f35241523fbab1&token2=0xaf88d065e77c8cc2239327c5edb3a432268e5831&network=arbitrum&exchange=uniswapv3&limit=10" | jq '.'
```

## Common Token Addresses

### Arbitrum Network
- **WETH**: `0x82af49447d8a07e3bd95bd0d56f35241523fbab1`
- **USDC**: `0xaf88d065e77c8cc2239327c5edb3a432268e5831`
- **USDT**: `0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9`
- **WBTC**: `0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f`
- **DAI**: `0xda10009cbd5d07dd0cecc66161fc93d7c9000da1`

### Ethereum Network
- **WETH**: `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`
- **USDC**: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- **USDT**: `0xdac17f958d2ee523a2206206994597c13d831ec7`

## Response Structure

The API returns:
- `rankings`: Object containing 5 ranked lists:
  - `score_1_ranking`: Current method (APR, ROI, Volume)
  - `score_2_ranking`: Age-based ranking
  - `score_3_ranking`: Market sentiment
  - `score_4_ranking`: ETH price signal
  - `aggregated_ranking`: Combined weighted score
- `positions`: Backward compatibility (aggregated ranking)
- `market_data`: ETH trend and token sentiment info
- `scoring_methods`: Description of each scoring method

## Example Response

```json
{
  "token0": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  "token1": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  "network": "arbitrum",
  "exchange": "uniswapv3",
  "total_positions": 50,
  "rankings": {
    "score_1_ranking": {
      "description": "Current method (APR, ROI, Volume)",
      "positions": [...]
    },
    "score_2_ranking": {
      "description": "Age-based ranking (0.1-1, 0.1-3, 0.1-7 days)",
      "positions": [...]
    },
    "score_3_ranking": {
      "description": "Market sentiment (pair average: positive/neutral)",
      "positions": [...]
    },
    "score_4_ranking": {
      "description": "ETH price signal (bullish)",
      "positions": [...]
    },
    "aggregated_ranking": {
      "description": "Aggregated weighted score (equal weights: 0.25 each)",
      "positions": [...]
    }
  },
  "market_data": {
    "eth_trend": {
      "trend": "bullish",
      "score": 0.65,
      "price_change_24h": 2.5,
      "price_change_7d": 5.2
    },
    "token1_sentiment": {
      "sentiment": "positive",
      "score": 0.72
    },
    "token2_sentiment": {
      "sentiment": "neutral",
      "score": 0.55
    }
  }
}
```

## Testing with Python

```python
import requests

url = "http://localhost:8000/positions/recommendations"
params = {
    "token1": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    "token2": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    "network": "arbitrum",
    "exchange": "uniswapv3",
    "limit": 10,
    "weight_apr": 0.4,
    "weight_roi": 0.4,
    "weight_volume": 0.2,
    "age_from": 0.1,
    "age_to": 1.0
}

response = requests.get(url, params=params)
data = response.json()

# Access individual rankings
print("Score 1 Ranking (APR/ROI/Volume):")
for pos in data["rankings"]["score_1_ranking"]["positions"]:
    print(f"  - NFT ID: {pos['nft_id']}, Score: {pos['score_1']}")

print("\nScore 2 Ranking (Age-based):")
for pos in data["rankings"]["score_2_ranking"]["positions"]:
    print(f"  - NFT ID: {pos['nft_id']}, Age: {pos['age']}, Score: {pos['score_2']}")

print("\nAggregated Ranking:")
for pos in data["rankings"]["aggregated_ranking"]["positions"]:
    print(f"  - NFT ID: {pos['nft_id']}, Weighted Score: {pos['weighted_score']}")
```

## Testing with JavaScript/Fetch

```javascript
const url = new URL('http://localhost:8000/positions/recommendations');
url.searchParams.append('token1', '0x82af49447d8a07e3bd95bd0d56f35241523fbab1');
url.searchParams.append('token2', '0xaf88d065e77c8cc2239327c5edb3a432268e5831');
url.searchParams.append('network', 'arbitrum');
url.searchParams.append('exchange', 'uniswapv3');
url.searchParams.append('limit', '10');

fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log('Score 1 Ranking:', data.rankings.score_1_ranking);
    console.log('Score 2 Ranking:', data.rankings.score_2_ranking);
    console.log('Score 3 Ranking:', data.rankings.score_3_ranking);
    console.log('Score 4 Ranking:', data.rankings.score_4_ranking);
    console.log('Aggregated Ranking:', data.rankings.aggregated_ranking);
    console.log('Market Data:', data.market_data);
  });
```

