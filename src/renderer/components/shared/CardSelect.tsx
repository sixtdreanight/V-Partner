import { Card } from "../ui/card";

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
    <div className="space-y-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="w-full text-left transition-all duration-200 active:scale-[0.99]"
          >
            <Card
              className={`p-4 ${
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "hover:border-muted-foreground/20 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                {opt.icon && <span className="text-xl">{opt.icon}</span>}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      active ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </div>
                  {opt.desc && (
                    <div className="text-xs mt-0.5 text-muted-foreground">
                      {opt.desc}
                    </div>
                  )}
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    active
                      ? "border-primary bg-primary scale-100"
                      : "border-muted-foreground/30 scale-90"
                  }`}
                >
                  {active && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
