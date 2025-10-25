'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import ResultDisplay from './ResultDisplay';
import { BarChart3, Zap, TrendingUp, Target, ChevronDown } from 'lucide-react';

export default function AnalysisInterface() {
  const [analysisType, setAnalysisType] = useState('general');
  const [inputData, setInputData] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const analysisTypes = [
    { value: 'general', label: 'General Analysis', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { value: 'position', label: 'Position Analysis', icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { value: 'position-plans', label: 'Position Plans', icon: Target, color: 'from-purple-500 to-purple-600' },
    { value: 'top-earning', label: 'Top Earning Analysis', icon: Zap, color: 'from-orange-500 to-orange-600' },
  ];

  const getPlaceholder = () => {
    switch (analysisType) {
      case 'position':
        return '{\n  "poolAddress": "0xc473e2aee3441bf9240be85eb122abb059a3b57c",\n  "token0": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",\n  "token1": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",\n  "fee": 3000,\n  "symbols": {\n    "token0": "WETH",\n    "token1": "USDC"\n  },\n  "ticks": {\n    "current": -193256,\n    "lower": -193500,\n    "upper": -193080\n  },\n  "prices": {\n    "currentToken1PerToken0": 4.049656458807099e-21,\n    "lowerToken1PerToken0": 3.952045418888768e-21,\n    "upperToken1PerToken0": 4.121557692428058e-21\n  }\n}';
      case 'position-plans':
        return '{\n  "poolAddress": "0xc473e2aee3441bf9240be85eb122abb059a3b57c",\n  "token0": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",\n  "token1": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",\n  "fee": 3000,\n  "symbols": {\n    "token0": "WETH",\n    "token1": "USDC"\n  },\n  "ticks": {\n    "current": -193256,\n    "lower": -193500,\n    "upper": -193080\n  },\n  "prices": {\n    "currentToken1PerToken0": 4.049656458807099e-21,\n    "lowerToken1PerToken0": 3.952045418888768e-21,\n    "upperToken1PerToken0": 4.121557692428058e-21\n  }\n}';
      case 'top-earning':
        return '{\n  "success": true,\n  "total_count": 169685,\n  "data": [\n    {\n      "in_range": true,\n      "pool": "0x73b14a78a0d396c521f954532d43fd5ffe385216",\n      "age": 0.5724537037,\n      "has_withdrawn": false,\n      "performance": {\n        "hodl": {\n          "pnl": "31.70938926133217745890233504237",\n          "roi": "0.4937452806",\n          "apr": "194610.5770",\n          "pool_pnl": "31.723435257372472881964744",\n          "pool_roi": "0.4939639901",\n          "pool_apr": "194808.0124",\n          "il": "-0.000437873613122719574911",\n          "fee_apr": "194699.4691"\n        }\n      }\n    }\n  ]\n}';
      default:
        return '{\n  "company": "TechCorp",\n  "revenue": 1000000,\n  "expenses": 750000,\n  "profit": 250000,\n  "growth_rate": 15.5\n}';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputData.trim()) return;

    setLoading(true);
    setResponse(''); // Clear previous response
    try {
      const data = JSON.parse(inputData);
      
      // Use streaming methods
      let response;
      switch (analysisType) {
        case 'position':
          response = await api.streamAnalyzePosition(data);
          break;
        case 'position-plans':
          response = await api.streamFindPositionPlans(data);
          break;
        case 'top-earning':
          response = await api.streamAnalyzeTopEarning(data);
          break;
        default:
          response = await api.streamAnalyze(data);
      }
      
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
                setResponse(fullResponse); // Update response in real-time
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
      setResponse('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const currentType = analysisTypes.find(type => type.value === analysisType);

  return (
    <div className="glass-effect rounded-2xl shadow-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentType?.color} flex items-center justify-center`}>
          {currentType && <currentType.icon className="w-6 h-6 text-white" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Data Analysis</h2>
          <p className="text-sm text-gray-600">Analyze your financial data with AI</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Analysis Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setAnalysisType(type.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    analysisType === type.value
                      ? `border-primary-500 bg-primary-50`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{type.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Input Data (JSON)
          </label>
          <div className="flex-1 relative">
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full h-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white/80 backdrop-blur-sm resize-none"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setInputData(getPlaceholder())}
              className="absolute top-3 right-3 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            >
              Use Test Data
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !inputData.trim()}
          className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-6 rounded-xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Analyze Data
            </>
          )}
        </button>
      </form>

      {response && (
        <div className="mt-6">
          <ResultDisplay 
            content={response} 
            title={`${currentType?.label} Result`}
            type="analysis"
          />
        </div>
      )}
    </div>
  );
}
