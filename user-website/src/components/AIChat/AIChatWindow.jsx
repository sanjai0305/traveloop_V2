// src/components/AIChat/AIChatWindow.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { useChat } from "../../hooks/useChat";

export const AIChatWindow = ({ isOpen, onClose }) => {
  const {
    messages,
    loading,
    isOnline,
    sendMessage,
    retryLastMessage,
    clearHistory,
    userName,
  } = useChat();

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />

          {/* Right Slide-in Glass Chat Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 right-0 z-[9999] w-full sm:w-[440px] md:w-[480px] h-[92vh] sm:h-[680px] max-h-[100vh] bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-t border-slate-200/80 dark:border-slate-800 rounded-t-[32px] sm:rounded-tl-[32px] sm:rounded-tr-none shadow-2xl flex flex-col overflow-hidden"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
            }}
          >
            {/* Header */}
            <ChatHeader
              isOnline={isOnline}
              onRetry={retryLastMessage}
              onClearHistory={clearHistory}
              onClose={onClose}
            />

            {/* Messages Body */}
            <ChatMessages
              messages={messages}
              loading={loading}
              userName={userName}
              onCloseChat={onClose}
              onSendPrompt={sendMessage}
            />

            {/* Input Footer */}
            <ChatInput
              onSendMessage={sendMessage}
              loading={loading}
              disabled={!isOnline && false}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIChatWindow;
