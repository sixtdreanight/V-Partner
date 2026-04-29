import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";

export default function PartnerDescriptionStep({
  data, update, handleDescriptionParse, parsePreview,
}: {
  data: { description: string };
  update: (d: Partial<{ description: string }>) => void;
  handleDescriptionParse: (t: string) => void;
  parsePreview: Record<string, unknown>;
}) {
  const fields = [
    { k: "age", l: "年龄" }, { k: "city", l: "城市" },
    { k: "occupation", l: "职业" }, { k: "temperament", l: "性格" },
  ];
  const hobbies = parsePreview.hobbies as string[] | undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">简单介绍她一下</h2>
        <p className="text-sm text-muted-foreground">用一句话描述你心目中的她</p>
      </div>
      <Textarea
        value={data.description}
        onChange={(e) => handleDescriptionParse(e.target.value)}
        placeholder="例如：25岁上海UI设计师，性格温柔粘人，喜欢撸猫探店"
        rows={4}
        autoFocus
        style={{ lineHeight: "1.8" }}
      />
      {Object.keys(parsePreview).length > 0 && (
        <div className="rounded-xl p-4 space-y-2 fade-in bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800">
          <Badge variant="primary" size="md">AI 解析结果</Badge>
          <div className="space-y-1.5 mt-2">
            {fields.map(({ k, l }) => {
              const v = parsePreview[k];
              if (v == null) return null;
              return (
                <div key={k} className="flex text-sm">
                  <span className="w-12 shrink-0 text-muted-foreground">{l}</span>
                  <span className="text-foreground">{String(v)}</span>
                </div>
              );
            })}
            {hobbies && hobbies.length > 0 && (
              <div className="flex text-sm">
                <span className="w-12 shrink-0 text-muted-foreground">爱好</span>
                <span className="text-foreground">{hobbies.join("、")}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
