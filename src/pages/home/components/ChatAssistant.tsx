import { useState } from 'react';

export default function ChatAssistant() {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      alert('Fonctionnalité de chat à venir');
      setMessage('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-[600px] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className="ri-robot-line text-2xl text-[#8B4513]"></i>
          <h3 className="text-xl font-bold text-gray-900">Assistant BTC Expert</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 rounded-full bg-[#8B4513]/10 flex items-center justify-center mx-auto mb-4">
            <i className="ri-chat-smile-3-line text-3xl text-[#8B4513]"></i>
          </div>
          <p className="text-sm leading-relaxed">
            Posez vos questions sur la construction BTC au Sénégal.<br />
            Je peux vous aider avec les calculs, les techniques de pose,<br />
            et les conseils adaptés au climat local.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Posez votre question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 h-12 rounded-lg border-2 border-gray-200 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="h-12 px-6 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-send-plane-fill"></i>
          </button>
        </div>
      </form>
    </div>
  );
}
