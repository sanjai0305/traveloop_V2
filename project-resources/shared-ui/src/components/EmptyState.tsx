import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";
import Heading from "./Typography";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-12 px-6 traveloop-card bg-[var(--surface)] ${className}`}
    role="status"
    aria-live="polite"
  >
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
      {icon || <Inbox className="w-8 h-8" aria-hidden="true" />}
    </div>
    <Heading as="h3" className="mb-2">
      {title}
    </Heading>
    {description && (
      <p className="text-body-sm text-[var(--text-muted)] max-w-sm text-pretty mb-6">{description}</p>
    )}
    {actionLabel && onAction && (
      <Button onClick={onAction} variant="primary">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
