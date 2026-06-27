"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface Button19Props {
  children: ReactNode;
  direction?: "left" | "right";
  href?: string;
  className?: string;
  disabled?: boolean;
}

export function Button19({ children, direction = "left", href, className, disabled }: Button19Props) {
  const Icon = direction === "left" ? FiArrowLeft : FiArrowRight;

  const inner = (
    <>
      {direction === "left" && (
        <Icon className="transition-transform duration-180 ease-in-out group-hover:-translate-x-1" />
      )}
      {children}
      {direction === "right" && (
        <Icon className="transition-transform duration-180 ease-in-out group-hover:translate-x-1" />
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Button variant="ghost" className={cn("group gap-2", className)} asChild>
        <Link href={href}>{inner}</Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" className={cn("group gap-2", className)} disabled={disabled}>
      {inner}
    </Button>
  );
}
