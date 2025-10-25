'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import ResultDisplay from './ResultDisplay';
import { Send, Bot, User } from 'lucide-react';

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', content: string}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setMessage('');
    setLoading(true);
    setResponse(''); // Clear previous response

    try {
      // Use streaming chat
      const response = await api.streamChat(userMessage);
      
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
      
      // Add final response to messages
      setMessages(prev => [...prev, { type: 'bot', content: fullResponse }]);
      
    } catch (error) {
      const errorMessage = 'Error: ' + (error as Error).message;
      setMessages(prev => [...prev, { type: 'bot', content: errorMessage }]);
      setResponse(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-effect rounded-2xl shadow-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
          <p className="text-sm text-gray-600">Ask me anything about financial analysis</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-96">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.type === 'user' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything about financial analysis..."
            className="w-full p-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white/80 backdrop-blur-sm"
            rows={3}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="absolute right-3 bottom-3 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Latest Response Display */}
      {response && !loading && (
        <div className="mt-4">
          <ResultDisplay 
            content={response} 
            title="Latest Response" 
            type="chat"
          />
        </div>
      )}
    </div>
  );
}
