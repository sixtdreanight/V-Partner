import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "src/renderer/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        primary:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success:
          "border-transparent bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        error:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const dotColors: Record<string, string> = {
  default: "bg-white/60",
  primary: "bg-white/60",
  secondary: "bg-zinc-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  destructive: "bg-red-500",
  outline: "bg-zinc-400",
};

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant ? dotColors[variant] : dotColors.default,
          )}
        />
      )}
      {children}
    </div>
  );
}

export default Badge;
export { Badge, badgeVariants };
