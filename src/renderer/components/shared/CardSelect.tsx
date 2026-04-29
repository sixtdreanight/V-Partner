import { Flex, Button } from "@radix-ui/themes";
import { Heart, Check } from "lucide-react";

interface Option<T extends string> {
  value: T;
  label: string;
  desc?: string;
  icon?: string;
}

export default function CardSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Flex direction="column" gap="2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Button
            key={opt.value}
            variant={active ? "solid" : "outline"}
            color={active ? undefined : "gray"}
            onClick={() => onChange(opt.value)}
            style={{ justifyContent: "flex-start", height: "auto", padding: "12px 16px" }}
          >
            <Flex align="center" gap="3" flexGrow="1">
              {opt.icon && <Heart size={18} />}
              <Flex direction="column" flexGrow="1" style={{ textAlign: "left" }}>
                <span style={{ fontWeight: 500 }}>{opt.label}</span>
                {opt.desc && (
                  <span style={{ fontSize: 12, color: "var(--gray-10)", fontWeight: 400, marginTop: 2 }}>
                    {opt.desc}
                  </span>
                )}
              </Flex>
              {active && (
                <Flex width="20px" height="20px" align="center" justify="center"
                  style={{ borderRadius: "50%", background: "var(--accent-9)" }}>
                  <Check size={12} color="white" />
                </Flex>
              )}
            </Flex>
          </Button>
        );
      })}
    </Flex>
  );
}
