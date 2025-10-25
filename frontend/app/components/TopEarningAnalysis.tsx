'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import ResultDisplay from './ResultDisplay';
import { BarChart3, Play, Square } from 'lucide-react';

export default function TopEarningAnalysis() {
  const [inputData, setInputData] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const getPlaceholder = () => {
    return '{\n  "success": true,\n  "total_count": 169685,\n  "data": [\n    {\n      "in_range": true,\n      "pool": "0x73b14a78a0d396c521f954532d43fd5ffe385216",\n      "age": 0.5724537037,\n      "has_withdrawn": false,\n      "performance": {\n        "hodl": {\n          "pnl": "31.70938926133217745890233504237",\n          "roi": "0.4937452806",\n          "apr": "194610.5770",\n          "pool_pnl": "31.723435257372472881964744",\n          "pool_roi": "0.4939639901",\n          "pool_apr": "194808.0124",\n          "il": "-0.000437873613122719574911",\n          "fee_apr": "194699.4691"\n        }\n      }\n    }\n  ]\n}';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputData.trim()) return;

    setLoading(true);
    setResponse('');
    try {
      const data = JSON.parse(inputData);
      
      // Use streaming method
      const response = await api.streamAnalyzeTopEarning(data);
      
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
            &gt; WALLET_POOL_DATA (JSON)
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
              <BarChart3 className="w-4 h-4" />
              EXECUTE_ANALYSIS
            </>
          )}
        </button>
      </form>

      {response && (
        <div className="mt-6">
          <ResultDisplay 
            content={response} 
            title="TOP_EARNING_ANALYSIS_OUTPUT"
            type="analysis"
          />
        </div>
      )}
    </div>
  );
}
