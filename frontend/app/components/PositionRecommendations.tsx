'use client';

import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import ResultDisplay from './ResultDisplay';
import { Search, Play, Square, TrendingUp, ArrowRightLeft, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { TOKENS, BLOCKCHAINS, EXCHANGES } from '../lib/tokens';

export default function PositionRecommendations() {
  const [selectedToken1, setSelectedToken1] = useState('WETH');
  const [selectedToken2, setSelectedToken2] = useState('USDC');
  const [network, setNetwork] = useState('arbitrum');
  const [exchange, setExchange] = useState('uniswapv3');
  const [limit, setLimit] = useState('10'); // Force top 10 only
  const [weightApr, setWeightApr] = useState('0.4');
  const [weightRoi, setWeightRoi] = useState('0.4');
  const [weightVolume, setWeightVolume] = useState('0.2');
  const [ageFrom, setAgeFrom] = useState('0.1');
  const [ageTo, setAgeTo] = useState('1');
  const [response, setResponse] = useState('');
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [llmAnalysis, setLlmAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Get available tokens for the selected network
  const availableTokens = useMemo(() => {
    return TOKENS.filter(token => token.addresses[network]);
  }, [network]);

  // Get token addresses
  const getTokenAddress = (symbol: string): string => {
    const token = TOKENS.find(t => t.symbol === symbol);
    return token?.addresses[network] || '';
  };

  const token1 = getTokenAddress(selectedToken1);
  const token2 = getTokenAddress(selectedToken2);

  // Popular swap pairs
  const popularPairs = [
    { token1: 'WETH', token2: 'USDC' },
    { token1: 'WETH', token2: 'USDT' },
    { token1: 'WETH', token2: 'WBTC' },
    { token1: 'USDC', token2: 'USDT' },
    { token1: 'WETH', token2: 'DAI' },
  ];

  const loadSampleData = () => {
    setSelectedToken1('WETH');
    setSelectedToken2('USDC');
    setNetwork('arbitrum');
    setExchange('uniswapv3');
    setLimit('10');
    setWeightApr('0.4');
    setWeightRoi('0.4');
    setWeightVolume('0.2');
  };

  const swapTokens = () => {
    const temp = selectedToken1;
    setSelectedToken1(selectedToken2);
    setSelectedToken2(temp);
  };

  const selectPair = (token1: string, token2: string) => {
    setSelectedToken1(token1);
    setSelectedToken2(token2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken1 || !selectedToken2 || !network.trim() || !exchange.trim()) {
      setResponse('ERROR: Please select both tokens');
      return;
    }

    if (selectedToken1 === selectedToken2) {
      setResponse('ERROR: Please select different tokens');
      return;
    }

    setLoading(true);
    setResponse('');
    
    try {
      const params = new URLSearchParams({
        token1,
        token2,
        network,
        exchange,
        limit: '10', // Always fetch top 10
        weight_apr: weightApr,
        weight_roi: weightRoi,
        weight_volume: weightVolume,
        age_from: ageFrom,
        age_to: ageTo,
      });

      const response = await fetch(`${api.getBaseUrl()}/positions/recommendations?${params}`);
      const data = await response.json();
      
      // Format the response nicely
      const formattedResponse = formatResponse(data);
      setResponse(formattedResponse);
      setResponseData(data);
      setCopied(false);
    } catch (error) {
      console.error('API Error:', error);
      setResponse(`ERROR: ${(error as Error).message}\n\nThis might be due to:\n1. Backend not running\n2. Invalid API response\n3. Network error`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (positionIndex?: number) => {
    if (!responseData || !responseData.positions || responseData.positions.length === 0) {
      setLlmAnalysis('ERROR: No position data available to analyze');
      return;
    }

    setAnalyzing(true);
    setLlmAnalysis('');
    
    try {
      let analysisPayload;
      
      // If positionIndex is provided, analyze only that position
      if (positionIndex !== undefined) {
        const position = responseData.positions[positionIndex];
        analysisPayload = {
          position: position, // Single position
          network: responseData.network || network,
          exchange: responseData.exchange || exchange,
          token0: responseData.token0 || token1,
          token1: responseData.token1 || token2,
        };
      } else {
        // Analyze all positions
        analysisPayload = {
          positions: responseData.positions,
          network: responseData.network || network,
          exchange: responseData.exchange || exchange,
          token0: responseData.token0 || token1,
          token1: responseData.token1 || token2,
        };
      }

      const response = await fetch(`${api.getBaseUrl()}/positions/recommendations/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisPayload),
      });

      const data = await response.json();
      
      if (data.error) {
        setLlmAnalysis(`ERROR: ${data.error}`);
      } else {
        setLlmAnalysis(data.result);
      }
    } catch (error) {
      console.error('LLM Analysis Error:', error);
      setLlmAnalysis(`ERROR: ${(error as Error).message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatResponse = (data: any): string => {
    // Handle error responses
    if (data.error) {
      return `ERROR: ${data.error}\n${JSON.stringify(data, null, 2)}`;
    }

    // Check if data has the expected structure
    const totalPositions = data.total_positions || (data.positions ? data.positions.length : 0);
    const networkName = data.network || 'Unknown';
    const exchangeName = data.exchange || 'Unknown';
    
    let result = `FOUND ${totalPositions} UNISWAP POSITIONS\n`;
    result += `NETWORK: ${networkName.toUpperCase()}\n`;
    result += `POOL: ${exchangeName.toUpperCase()}\n`;
    
    if (data.scoring_weights) {
      result += `SCORING WEIGHTS:\n`;
      result += `  - APR: ${(data.scoring_weights.apr * 100).toFixed(0)}%\n`;
      result += `  - ROI: ${(data.scoring_weights.roi * 100).toFixed(0)}%\n`;
      result += `  - Volume: ${(data.scoring_weights.volume * 100).toFixed(0)}%\n\n`;
    }
    
    if (data.positions && data.positions.length > 0) {
      result += 'TOP UNISWAP POSITIONS:\n';
      result += '='.repeat(80) + '\n\n';
      
      data.positions.slice(0, 10).forEach((pos: any, index: number) => {
        result += `${index + 1}. `;
        
        // Try to get position ID
        if (pos.nft_id) {
          result += `Position ID: ${pos.nft_id}\n`;
        } else if (pos.id) {
          result += `ID: ${pos.id}\n`;
        } else {
          result += `Position #${index + 1}\n`;
        }
        
        // Weighted score
        if (pos.weighted_score !== undefined) {
          result += `   Score: ${(pos.weighted_score * 100).toFixed(2)}%\n`;
        }
        
        // APR
        if (pos.apr !== undefined && typeof pos.apr === 'number') {
          result += `   APR: ${pos.apr.toFixed(2)}%\n`;
        }
        
        // ROI
        if (pos.roi !== undefined && typeof pos.roi === 'number') {
          result += `   ROI: ${pos.roi.toFixed(2)}%\n`;
        }
        
        // Fee tier
        if (pos.fee_tier) {
          result += `   Fee Tier: ${pos.fee_tier}\n`;
        }
        
        // Ticks
        if (pos.tick_lower !== undefined && pos.tick_upper !== undefined) {
          result += `   Ticks: ${pos.tick_lower} to ${pos.tick_upper}\n`;
        }
        
        // In range status
        if (pos.in_range !== undefined) {
          result += `   In Range: ${pos.in_range ? 'Yes' : 'No'}\n`;
        }
        
        // Age
        if (pos.age !== undefined) {
          result += `   Age: ${parseFloat(pos.age.toString()).toFixed(1)} days\n`;
        }
        
        // Underlying value (TVL)
        if (pos.underlying_value !== undefined) {
          result += `   TVL: $${parseFloat(pos.underlying_value.toString()).toLocaleString()}\n`;
        }
        
        result += '\n';
      });
    } else {
      result += '\nNO POSITIONS FOUND\n';
      result += `Response: ${JSON.stringify(data, null, 2)}\n`;
    }
    
    return result;
  };

  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 h-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        <div className="space-y-4">
          {/* Popular Pairs Quick Select */}
          <div className="mb-6">
            <div className="text-xs font-bold text-green-400 mb-3">POPULAR POOL PAIRS</div>
            <div className="flex flex-wrap gap-2">
              {popularPairs.map((pair, idx) => {
                const isActive = selectedToken1 === pair.token1 && selectedToken2 === pair.token2;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectPair(pair.token1, pair.token2)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-green-600 text-black'
                        : 'bg-gray-800 hover:bg-gray-700 text-green-400'
                    }`}
                  >
                    {pair.token1}/{pair.token2}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pool Interface */}
          <div className="bg-black border border-gray-600 rounded-lg p-5">
            <div className="text-xs font-bold text-green-400 mb-4">FIND UNISWAP POSITIONS</div>
            
            {/* Token Display */}
            <div className="space-y-3 mb-4">
              {/* Token 1 */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">FROM</span>
                  <span className="text-lg font-bold text-green-400">{selectedToken1 || 'Select'}</span>
                </div>
                {token1 && (
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {token1}
                  </div>
                )}
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={swapTokens}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors z-10"
                  disabled={loading}
                >
                  <ArrowRightLeft className="w-5 h-5 text-green-400" />
                </button>
              </div>

              {/* Token 2 */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">TO</span>
                  <span className="text-lg font-bold text-green-400">{selectedToken2 || 'Select'}</span>
                </div>
                {token2 && (
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {token2}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Token Selection */}
            <div className="border-t border-gray-700 pt-4 space-y-3">
              <div className="text-xs text-gray-400 mb-2">CUSTOM POOL SELECTION</div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedToken1}
                  onChange={(e) => setSelectedToken1(e.target.value)}
                  className="p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-900 text-green-400 font-mono text-xs"
                  disabled={loading}
                >
                  <option value="">Select from...</option>
                  {availableTokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedToken2}
                  onChange={(e) => setSelectedToken2(e.target.value)}
                  className="p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-900 text-green-400 font-mono text-xs"
                  disabled={loading}
                >
                  <option value="">Select to...</option>
                  {availableTokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Network and Exchange */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-green-400 mb-2">
                BLOCKCHAIN
              </label>
              <select
                value={network}
                onChange={(e) => {
                  setNetwork(e.target.value);
                  // Reset tokens when network changes
                  setSelectedToken1('');
                  setSelectedToken2('');
                }}
                className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-green-400 text-sm"
                disabled={loading}
              >
                {BLOCKCHAINS.map((chain) => (
                  <option key={chain.value} value={chain.value}>
                    {chain.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-green-400 mb-2">
                EXCHANGE
              </label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-green-400 text-sm"
                disabled={loading}
              >
                {EXCHANGES.map((ex) => (
                  <option key={ex.value} value={ex.value}>
                    {ex.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Age Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-green-400 mb-2">
                AGE FROM (days)
              </label>
              <input
                type="number"
                value={ageFrom}
                onChange={(e) => setAgeFrom(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-green-400 text-sm"
                step="0.1"
                min="0"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-green-400 mb-2">
                AGE TO (days)
              </label>
              <input
                type="number"
                value={ageTo}
                onChange={(e) => setAgeTo(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-green-400 text-sm"
                step="0.1"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          {/* Weight Config */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">APR Weight</label>
              <input
                type="number"
                value={weightApr}
                onChange={(e) => setWeightApr(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-green-400 text-sm"
                step="0.1"
                min="0"
                max="1"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">ROI Weight</label>
              <input
                type="number"
                value={weightRoi}
                onChange={(e) => setWeightRoi(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-green-400 text-sm"
                step="0.1"
                min="0"
                max="1"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Volume Weight</label>
              <input
                type="number"
                value={weightVolume}
                onChange={(e) => setWeightVolume(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-green-400 text-sm"
                step="0.1"
                min="0"
                max="1"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadSampleData}
              className="px-4 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              LOAD_SAMPLE
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token1.trim() || !token2.trim()}
          className="w-full bg-green-600 text-black py-3 px-6 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2 mt-auto"
        >
          {loading ? (
            <>
              <Square className="w-4 h-4" />
              SEARCHING...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              FIND_RECOMMENDATIONS
            </>
          )}
        </button>
      </form>

      {response && (
        <div className="mt-6 space-y-4">
          {/* Structured Table View (if data exists) */}
          {responseData && responseData.positions && responseData.positions.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              {/* Actions */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-green-400">TOP RECOMMENDATIONS</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnalyze()}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {analyzing ? 'ANALYZING...' : 'GET AI ANALYSIS'}
                  </button>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        COPIED!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        COPY
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-gray-800 text-green-400">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Lower Tick</th>
                      <th className="px-3 py-2 text-left">Upper Tick</th>
                      <th className="px-3 py-2 text-left">Fee Tier</th>
                      <th className="px-3 py-2 text-left">APR</th>
                      <th className="px-3 py-2 text-left">ROI</th>
                      <th className="px-3 py-2 text-left">TVL</th>
                      <th className="px-3 py-2 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    {responseData.positions.slice(0, 10).map((pos: any, index: number) => (
                      <>
                        <tr 
                          key={index} 
                          className="border-t border-gray-700 hover:bg-gray-800 cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                        >
                          <td className="px-3 py-2">{index + 1}</td>
                          <td className="px-3 py-2">{pos.tick_lower !== undefined ? pos.tick_lower.toString() : 'N/A'}</td>
                          <td className="px-3 py-2">{pos.tick_upper !== undefined ? pos.tick_upper.toString() : 'N/A'}</td>
                          <td className="px-3 py-2">{pos.fee_tier || 'N/A'}</td>
                          <td className="px-3 py-2 text-green-400">
                            {pos.apr !== undefined ? `${pos.apr.toFixed(2)}%` : 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-green-400">
                            {pos.roi !== undefined ? `${pos.roi.toFixed(2)}%` : 'N/A'}
                          </td>
                          <td className="px-3 py-2">
                            {pos.underlying_value ? `$${parseFloat(pos.underlying_value.toString()).toLocaleString()}` : 'N/A'}
                          </td>
                          <td className="px-3 py-2">
                            {expandedRow === index ? (
                              <ChevronUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </td>
                        </tr>
                        {expandedRow === index && (
                          <tr className="bg-gray-800 border-t border-gray-700">
                            <td colSpan={8} className="px-3 py-4">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <div className="text-green-400 font-bold mb-2">POSITION DETAILS</div>
                                  <div className="space-y-1 text-gray-400">
                                    <div><span className="text-gray-500">NFT ID:</span> {pos.nft_id || 'N/A'}</div>
                                    <div><span className="text-gray-500">Pool:</span> <span className="font-mono text-xs">{pos.pool || 'N/A'}</span></div>
                                    <div><span className="text-gray-500">Network:</span> {pos.network || 'N/A'}</div>
                                    <div><span className="text-gray-500">Exchange:</span> {pos.exchange || 'N/A'}</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-green-400 font-bold mb-2">PERFORMANCE</div>
                                  <div className="space-y-1 text-gray-400">
                                    <div><span className="text-gray-500">Age:</span> {pos.age !== undefined ? `${parseFloat(pos.age.toString()).toFixed(1)} days` : 'N/A'}</div>
                                    <div><span className="text-gray-500">In Range:</span> {pos.in_range !== undefined ? (
                                      <span className={pos.in_range ? 'text-green-400' : 'text-red-400'}>
                                        {pos.in_range ? 'Yes ✓' : 'No ✗'}
                                      </span>
                                    ) : 'N/A'}</div>
                                    <div><span className="text-gray-500">Score:</span> {pos.weighted_score !== undefined ? `${(pos.weighted_score * 100).toFixed(2)}%` : 'N/A'}</div>
                                    {pos.pnl !== undefined && (
                                      <div><span className="text-gray-500">PNL:</span> ${parseFloat(pos.pnl.toString()).toLocaleString()}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-gray-700">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnalyze(index);
                                  }}
                                  disabled={analyzing}
                                  className="w-full px-3 py-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors disabled:opacity-50"
                                >
                                  {analyzing ? 'ANALYZING...' : '🔍 AI ANALYZE THIS POSITION'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LLM Analysis Result */}
          {llmAnalysis && (
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-yellow-400">AI ANALYSIS</h4>
              </div>
              <div className="max-h-96 overflow-y-auto bg-black border border-yellow-600 rounded p-3">
                <ResultDisplay
                  content={llmAnalysis}
                  title=""
                  type="analysis"
                />
              </div>
            </div>
          )}

          {/* Text Display (Below Table) */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-green-400">RAW OUTPUT</h4>
            </div>
            <div className="max-h-96 overflow-y-auto bg-black border border-gray-600 rounded p-3">
              <ResultDisplay
                content={response}
                title=""
                type="analysis"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

