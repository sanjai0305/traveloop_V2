// src/components/ai/AIAssistant.jsx
import React from "react";
import AIChat from "../AIChat";

const AIAssistant = ({ isOpen, onClose }) => {
  return <AIChat isOpen={isOpen} onClose={onClose} />;
};

export default AIAssistant;
