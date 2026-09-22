import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, JobStatus, ChatMessage } from '../types';
import { getJobMessages, sendJobMessage } from '../services/storage';

interface JobChatProps {
  jobId: string;
  currentUser: UserAccount;
  jobStatus: JobStatus;
  partnerName: string;
  partnerRole: string;
}

export const JobChat: React.FC<JobChatProps> = ({
  jobId,
  currentUser,
  jobStatus,
  partnerName,
  partnerRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  const isClosed = jobStatus === 'cancelled' || jobStatus === 'rejected';

  // Helper to scroll ONLY the internal chat container
  const scrollChatToBottom = (smooth = false) => {
    if (chatScrollContainerRef.current) {
      const container = chatScrollContainerRef.current;
      if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  const loadMessages = () => {
    const res = getJobMessages(jobId);
    if (res.success && res.messages) {
      setMessages((prev) => {
        // Prevent re-rendering and scroll jumping if messages haven't changed
        if (
          prev.length === res.messages!.length &&
          (prev.length === 0 || prev[prev.length - 1]?.id === res.messages![res.messages!.length - 1]?.id)
        ) {
          return prev;
        }
        return res.messages!;
      });
    }
  };

  useEffect(() => {
    loadMessages();

    const handleSync = () => {
      loadMessages();
    };

    window.addEventListener(`quickhelp_chat_update_${jobId}`, handleSync);
    window.addEventListener('quickhelp_chat_update', handleSync);
    window.addEventListener('storage', handleSync);
    const interval = setInterval(loadMessages, 1500);

    return () => {
      window.removeEventListener(`quickhelp_chat_update_${jobId}`, handleSync);
      window.removeEventListener('quickhelp_chat_update', handleSync);
      window.removeEventListener('storage', handleSync);
      clearInterval(interval);
    };
  }, [jobId]);

  // Handle internal chat container scroll ONLY - NEVER touch window or outer page scroll
  useEffect(() => {
    if (!chatScrollContainerRef.current) return;
    const container = chatScrollContainerRef.current;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      // Internal scroll only on initial load
      container.scrollTop = container.scrollHeight;
    } else if (messages.length > prevMessagesCountRef.current) {
      // If a new message arrived, only scroll internal container if user is already near bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      if (isNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isClosed || isSending) return;

    setError('');
    setIsSending(true);

    const res = sendJobMessage(jobId, inputMessage.trim());
    if (res.success && res.message) {
      setInputMessage('');
      setMessages((prev) => [...prev, res.message!]);
      // Scroll internal chat container on user's own sent message
      setTimeout(() => scrollChatToBottom(true), 50);
    } else {
      setError(res.error || 'Failed to send message.');
    }
    setIsSending(false);
  };

  return (
    <div className="bg-[#ffffff] rounded-3xl border border-[#e1e9e5]/80 shadow-sm flex flex-col h-[480px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 sm:px-6 bg-[#f2f3ff] border-b border-[#e1e9e5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#12345b] text-white flex items-center justify-center font-bold text-sm">
            {partnerName ? partnerName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f]">
                {partnerName}
              </span>
              <span className="px-2 py-0.5 bg-[#e9edff] text-[#12345b] text-[10px] font-bold rounded-full uppercase">
                {partnerRole}
              </span>
            </div>
            <span className="font-['Inter'] text-[11px] text-[#006c4c] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#006c4c] animate-pulse" />
              <span>Private Secure Session</span>
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-[11px] text-[#74777f] block">
            Job #{jobId}
          </span>
          <span className="text-[10px] text-[#74777f]">
            End-to-End Logged
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#faf8ff]/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#e9edff] text-[#006c4c] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">chat</span>
            </div>
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f]">
              Private Coordination Chat
            </h4>
            <p className="font-['Inter'] text-xs text-[#43474e] max-w-xs leading-relaxed">
              Use this private room to coordinate arrival, share apartment gate details, or ask quick questions without sharing personal numbers.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-[#74777f]">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-[#74777f]/70">• {timeStr}</span>
                </div>
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs font-['Inter'] leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-[#006c4c] text-white rounded-tr-none'
                      : 'bg-[#ffffff] text-[#0d1b36] border border-[#e1e9e5] rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="px-4 py-2 bg-[#ffdad6] text-[#93000a] text-xs font-semibold flex items-center justify-between border-t border-[#ba1a1a]/20">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs">✕</button>
        </div>
      )}

      {/* Input or Closed Notice */}
      {isClosed ? (
        <div className="p-3 bg-[#f2f3ff] border-t border-[#e1e9e5] text-center text-xs text-[#74777f] font-['Inter']">
          🔒 Messaging is archived because this job session is {jobStatus}.
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-[#ffffff] border-t border-[#e1e9e5] flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${partnerName || 'partner'}...`}
            className="flex-1 px-4 py-2.5 bg-[#f2f3ff] rounded-xl text-xs font-['Inter'] text-[#0d1b36] outline-none focus:bg-[#ffffff] focus:border-[#006c4c] border border-transparent transition-all placeholder:text-[#74777f]"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-['Inter'] flex items-center gap-1.5 transition-all shadow-xs ${
              inputMessage.trim() && !isSending
                ? 'bg-[#006c4c] text-white hover:bg-[#003b2a] cursor-pointer'
                : 'bg-[#e1e9e5] text-[#74777f] cursor-not-allowed'
            }`}
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </form>
      )}
    </div>
  );
};
