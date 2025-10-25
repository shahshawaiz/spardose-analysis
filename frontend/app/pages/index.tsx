import PositionAnalysis from '../components/PositionAnalysis';
import TopEarningAnalysis from '../components/TopEarningAnalysis';
import ChatInterface from '../components/ChatInterface';
import { Terminal, Activity, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [showChat, setShowChat] = useState(false);

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

      {/* Main Terminal Interface */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-green-400">POSITION_ANALYSIS</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                &gt; Analyze position data and get insights
              </p>
            </div>
            <PositionAnalysis />
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-green-400">TOP_EARNING_ANALYSIS</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                &gt; Analyze wallet pool data and identify top performers
              </p>
            </div>
            <TopEarningAnalysis />
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
