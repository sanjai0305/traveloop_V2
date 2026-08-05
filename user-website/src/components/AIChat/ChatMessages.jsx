// src/components/AIChat/ChatMessages.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, User } from "lucide-react";
import TripCard from "./TripCard";
import TypingIndicator from "./TypingIndicator";

const FormattedText = ({ text }) => {
  if (!text) return null;
  return (
    <div className="whitespace-pre-line leading-relaxed">
      {text.split("\n").map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < text.split("\n").length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};

export const ChatMessages = ({ messages, loading, userName, onCloseChat, onSendPrompt }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {/* AI Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                <Bot size={16} />
              </div>
            )}

            <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div
                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium shadow-xs leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-tr-xs"
                    : msg.isError
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-tl-xs"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs"
                }`}
              >
                <FormattedText text={msg.text} />
              </div>

              {/* Message Timestamp */}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 px-1">
                {msg.timestamp}
              </span>

              {/* Rich Trip Cards */}
              {!isUser && msg.trips?.length > 0 && (
                <div className="w-full mt-2 space-y-2">
                  {msg.trips.map((trip, idx) => (
                    <TripCard key={trip.trip_id || trip._id || idx} trip={trip} onCloseChat={onCloseChat} />
                  ))}
                </div>
              )}

              {/* Suggested Follow-up Prompts */}
              {!isUser && msg.followUps?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.followUps.slice(0, 3).map((fu, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendPrompt(typeof fu === "string" ? fu : `Tell me more about ${fu}`)}
                      className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-full px-2.5 py-1 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
                    >
                      💡 {typeof fu === "string" ? fu : `Tell me more about ${fu}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-2xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                <User size={15} />
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Typing Indicator */}
      {loading && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
