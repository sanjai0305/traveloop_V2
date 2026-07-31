import React from "react";
import Modal from "./Modal";

/** Dialog — semantic alias for Modal with unified API */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  children,
  size = "md",
}) => (
  <Modal isOpen={open} onClose={() => onOpenChange(false)} title={title} size={size}>
    {children}
  </Modal>
);

export default Dialog;
