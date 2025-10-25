import ChatInterface from '../components/ChatInterface';
import AnalysisInterface from '../components/AnalysisInterface';
import { Sparkles, BarChart3, MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-secondary-600/10"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Analytics</span>
            </div>
            <h1 className="text-5xl font-bold gradient-text mb-4">
              Spardose Analytics
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transform your financial data into actionable insights with our advanced AI-powered analysis platform
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-effect rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analysis</h3>
              <p className="text-gray-600 text-sm">Deep insights into your financial positions and market trends</p>
            </div>
            
            <div className="glass-effect rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-gray-600 text-sm">Get instant answers and recommendations from our AI expert</p>
            </div>
            
            <div className="glass-effect rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Insights</h3>
              <p className="text-gray-600 text-sm">Discover patterns and opportunities in your investment data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div className="fade-in">
            <ChatInterface />
          </div>
          <div className="fade-in" style={{animationDelay: '0.2s'}}>
            <AnalysisInterface />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="flex items-center justify-center gap-2">
              <span>Powered by</span>
              <span className="font-semibold gradient-text">FastAPI</span>
              <span>and</span>
              <span className="font-semibold gradient-text">Next.js</span>
            </p>
            <p className="text-sm mt-2">© 2024 Spardose Analytics. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
