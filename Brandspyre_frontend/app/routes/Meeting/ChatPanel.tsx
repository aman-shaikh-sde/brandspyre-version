import React, { useRef, useState, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";

interface ChatPanelProps {
  meetingId: string;
  chatMessages: any[];
  userName: string;
  userId: number;
  emitSocketEvent: (event: string, payload: any) => void;
}

export default function ChatPanel({ meetingId, chatMessages, userName, userId, emitSocketEvent }: ChatPanelProps) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when a new chat message arrives
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageObj = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      userName,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    emitSocketEvent("chat-msg-send", { messageObj });
    setText("");
  };

  const handleAddEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-700 pb-3 mb-4">
        <MessageSquare className="text-red-500" size={18} />
        <h3 className="font-semibold text-sm">Meeting Chat</h3>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs"
        style={{ scrollbarWidth: "thin" }}
      >
        {chatMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No messages yet. Send a message to start chatting!
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.userId === userId;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-gray-500 mb-0.5">{msg.userName}</span>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] break-words ${isMe ? "bg-red-700 text-white rounded-tr-none" : "bg-gray-700 text-gray-200 rounded-tl-none"}`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[8px] text-gray-600 mt-0.5">{msg.timestamp}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Emoji Bar */}
      <div className="flex gap-1.5 justify-start mt-2 border-t border-gray-700/50 pt-2">
        {["👍", "👏", "❤️", "😂", "😮", "🎉"].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleAddEmoji(emoji)}
            className="text-sm hover:scale-125 transition active:scale-100"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Form Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-500"
        />
        <button
          type="submit"
          className="bg-red-700 hover:bg-red-800 text-white rounded p-2 flex items-center justify-center transition"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
