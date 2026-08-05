// src/components/AIChat/ChatInput.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Zap } from "lucide-react";
import SuggestedPrompts from "./SuggestedPrompts";

export const ChatInput = ({ onSendMessage, loading, disabled }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || disabled) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectPrompt = (promptText) => {
    onSendMessage(promptText);
  };

  return (
    <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 space-y-2">
      {/* Quick Suggested Prompts Bar */}
      <SuggestedPrompts onSelect={handleSelectPrompt} disabled={loading || disabled} />

      {/* Main Glass Input Field */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-teal-500 dark:focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all shadow-inner">
        <Zap size={16} className="text-teal-500 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about travel, trips, budgets..."
          disabled={loading || disabled}
          className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleSend}
          disabled={!input.trim() || loading || disabled}
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:pointer-events-none shadow-xs transition-all"
          title="Send message"
        >
          <Send size={14} className="text-white" />
        </motion.button>
      </div>
    </div>
  );
};

export default ChatInput;
