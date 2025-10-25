'use client';

import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { api } from '../lib/api';

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', content: string}>>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setMessage('');
    setLoading(true);

    try {
      // Use streaming chat
      const response = await api.streamChat({ message: userMessage });
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      let botResponse = '';
      const decoder = new TextDecoder();
      
      // Add initial bot message
      setMessages(prev => [...prev, { type: 'bot', content: '' }]);
      
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
                botResponse += data.content;
                // Update the last message (bot's response) with streaming content
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { type: 'bot', content: botResponse };
                  return newMessages;
                });
              }
              if (data.error) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { type: 'bot', content: `Error: ${data.error}` };
                  return newMessages;
                });
                break;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
      
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: `Error: ${(error as Error).message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
        
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Bot className="w-8 h-8 mx-auto mb-3 text-gray-500" />
            <p className="text-xs">Ask me anything about DeFi, positions, or analysis!</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about DeFi, positions, or analysis..."
            className="w-full p-2 pr-10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-black text-green-400 text-xs"
            rows={2}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="absolute right-2 bottom-2 p-1 bg-green-600 text-black rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
