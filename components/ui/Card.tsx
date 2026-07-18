import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  hover = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={`${hover ? "panel-hover" : "panel"} ${className}`}>
      {children}
    </div>
  );
}
