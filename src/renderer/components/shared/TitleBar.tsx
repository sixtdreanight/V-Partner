import type { ReactNode } from "react";
import { Flex } from "@radix-ui/themes";
import { usePlatform } from "../../hooks/usePlatform";

export default function TitleBar({
  children,
  height = 52,
  borderColor = "var(--gray-3)",
  background = "var(--color-background)",
  justify = "between",
  align = "center",
}: {
  children: ReactNode;
  height?: number;
  borderColor?: string;
  background?: string;
  justify?: "start" | "center" | "end" | "between";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
}) {
  const { isMac } = usePlatform();

  return (
    <Flex
      height={`${height}px`}
      align={align}
      justify={justify}
      flexShrink="0"
      style={{
        borderBottom: `1px solid ${borderColor}`,
        background,
        WebkitAppRegion: "drag",
        paddingLeft: isMac ? 80 : 16,
        paddingRight: 12,
      }}
    >
      {children}
    </Flex>
  );
}
