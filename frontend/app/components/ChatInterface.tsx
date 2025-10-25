'use client';

import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', content: string}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setMessage('');

    // Simple placeholder response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Chat functionality is currently disabled. Use the main analysis tools above for AI-powered insights.' 
      }]);
    }, 1000);
  };

  return (
    <div className="bg-black rounded-lg border border-gray-600 p-4 h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-64">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'bot' && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-black" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
              msg.type === 'user' 
                ? 'bg-green-600 text-black' 
                : 'bg-gray-800 text-gray-300'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.type === 'user' && (
              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Chat disabled - use analysis tools above..."
            className="w-full p-2 pr-10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-black text-green-400 text-xs"
            rows={2}
            disabled
          />
          <button
            type="submit"
            disabled={true}
            className="absolute right-2 bottom-2 p-1 bg-gray-600 text-gray-400 rounded transition-colors cursor-not-allowed"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
