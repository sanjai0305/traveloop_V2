// src/components/AIChat/index.jsx
// Main self-contained Traveloop AI Chatbot interface.

import React, { useState } from "react";
import AIChatButton from "./AIChatButton";
import AIChatWindow from "./AIChatWindow";

export const AIChat = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof externalIsOpen === "boolean";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (!isControlled) setInternalIsOpen(true);
  };

  const handleClose = () => {
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  return (
    <>
      <AIChatButton onClick={handleOpen} isOpen={isOpen} />
      <AIChatWindow isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default AIChat;
