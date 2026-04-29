import { Heart } from "lucide-react";
import CardSelect from "../shared/CardSelect";

export default function RelationshipTypeStep({
  data, update,
}: {
  data: { relationshipType: "girlfriend" | "boyfriend" };
  update: (d: Partial<{ relationshipType: string }>) => void;
}) {
  const options = [
    { value: "girlfriend" as const, label: "女朋友", desc: "温柔可爱的她" },
    { value: "boyfriend" as const, label: "男朋友", desc: "可靠的另一半" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="text-lg font-semibold">你希望 TA 是你的？</h2>
        <p className="text-sm text-muted-foreground">选择你想要的伴侣角色</p>
      </div>
      <CardSelect options={options} value={data.relationshipType} onChange={(v) => update({ relationshipType: v })} />
    </div>
  );
}
