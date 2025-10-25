'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import ResultDisplay from './ResultDisplay';
import { TrendingUp, Play, Square } from 'lucide-react';

export default function PositionAnalysis() {
  const [inputData, setInputData] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const getPlaceholder = () => {
    return '{\n  "poolAddress": "0xc473e2aee3441bf9240be85eb122abb059a3b57c",\n  "token0": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",\n  "token1": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",\n  "fee": 3000,\n  "symbols": {\n    "token0": "WETH",\n    "token1": "USDC"\n  },\n  "ticks": {\n    "current": -193256,\n    "lower": -193500,\n    "upper": -193080\n  },\n  "prices": {\n    "currentToken1PerToken0": 4.049656458807099e-21,\n    "lowerToken1PerToken0": 3.952045418888768e-21,\n    "upperToken1PerToken0": 4.121557692428058e-21\n  }\n}';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputData.trim()) return;

    setLoading(true);
    setResponse('');
    try {
      const data = JSON.parse(inputData);
      
      // Use streaming method
      const response = await api.streamAnalyzePosition(data);
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      let fullResponse = '';
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                setResponse(fullResponse);
              }
              if (data.error) {
                setResponse(data.error);
                break;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
      
    } catch (error) {
      setResponse('ERROR: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 h-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-bold text-green-400 mb-3">
            &gt; POSITION_DATA_INPUT (JSON)
          </label>
          <div className="flex-1 relative">
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full h-full p-4 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm bg-black text-green-400 resize-none"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setInputData(getPlaceholder())}
              className="absolute top-3 right-3 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              LOAD_SAMPLE
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !inputData.trim()}
          className="w-full bg-green-600 text-black py-3 px-6 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Square className="w-4 h-4" />
              ANALYZING...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              EXECUTE_ANALYSIS
            </>
          )}
        </button>
      </form>

      {response && (
        <div className="mt-6">
          <ResultDisplay 
            content={response} 
            title="POSITION_ANALYSIS_OUTPUT"
            type="analysis"
          />
        </div>
      )}
    </div>
  );
}
