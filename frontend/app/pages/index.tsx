import PositionAnalysis from '../components/PositionAnalysis';
import TopEarningAnalysis from '../components/TopEarningAnalysis';
import PositionRecommendations from '../components/PositionRecommendations';
import ChatInterface from '../components/ChatInterface';
import { Terminal, Activity, MessageCircle, X, TrendingUp } from 'lucide-react';
import { useState } from 'react';

type TabType = 'recommendations' | 'analysis' | 'top-earning';

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('recommendations');

  const tabs = [
    { id: 'recommendations' as TabType, label: 'UNISWAP_POSITIONS', icon: TrendingUp },
    { id: 'analysis' as TabType, label: 'POSITION_ANALYSIS', icon: Activity },
    { id: 'top-earning' as TabType, label: 'TOP_EARNING_ANALYSIS', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Terminal Header */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold text-green-400">SPARDOSE_ANALYTICS</h1>
            <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">v2.0.0</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-6 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="border-b border-gray-700 mb-6">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors ${
                      isActive
                        ? 'text-green-400 border-b-2 border-green-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Interface */}
      <div className="container mx-auto px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            {activeTab === 'recommendations' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-green-400">UNISWAP POSITION FINDER</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  &gt; Find best Uniswap pool positions ranked by APR, ROI, and TVL
                </p>
                <PositionRecommendations />
              </div>
            )}

            {activeTab === 'analysis' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-green-400">POSITION_ANALYSIS</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  &gt; Analyze position data and get insights
                </p>
                <PositionAnalysis />
              </div>
            )}

            {activeTab === 'top-earning' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-green-400">TOP_EARNING_ANALYSIS</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  &gt; Analyze wallet pool data and identify top performers
                </p>
                <TopEarningAnalysis />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-500 text-black rounded-full flex items-center justify-center transition-colors z-50"
      >
        {showChat ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Interface (Hidden by default) */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-gray-900 border border-gray-700 rounded-lg z-40">
          <div className="p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-green-400">CHAT_ASSISTANT</h3>
            </div>
            <div className="h-full overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        </div>
      )}

      {/* Terminal Footer */}
      <div className="bg-gray-900 border-t border-gray-700 mt-16">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center text-gray-500 text-sm">
            <p>SPARDOSE_ANALYTICS v2.0.0 | Powered by FastAPI & Next.js | Terminal Interface</p>
          </div>
        </div>
      </div>
    </div>
  );
}
