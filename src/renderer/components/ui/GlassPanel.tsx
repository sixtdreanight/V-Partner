import type { ReactNode } from "react";
import { Card } from "./card";
import { cn } from "src/renderer/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export default function GlassPanel({
  children,
  className = "",
  style,
  onClick,
}: Props) {
  return (
    <Card
      className={cn("glass rounded-2xl shadow-lg", className)}
      style={style}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}
