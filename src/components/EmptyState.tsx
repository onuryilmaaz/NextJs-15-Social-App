"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "./ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-6 rounded-2xl border border-border/50 bg-card/50 p-8 text-center ${className || ""}`}
    >
      {icon && (
        <div className="animate-pulse text-muted-foreground/50">{icon}</div>
      )}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-foreground/90">{title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground/80">
          {description}
        </p>
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          asChild={!!action.href}
          variant="default"
          className="mt-4"
        >
          {action.href ? (
            <Link href={action.href}>{action.label}</Link>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );
}
