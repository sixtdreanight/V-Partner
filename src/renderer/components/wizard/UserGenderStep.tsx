import { User } from "lucide-react";
import CardSelect from "../shared/CardSelect";

const options = [
  { value: "male" as const, label: "男生", desc: `对方会用「他」称呼你` },
  { value: "female" as const, label: "女生", desc: `对方会用「她」称呼你` },
  { value: "other" as const, label: "其他", desc: `对方会用「TA」称呼你` },
];

export default function UserGenderStep({
  data, update,
}: {
  data: { userGender: string };
  update: (d: Partial<{ userGender: string }>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="text-lg font-semibold">你的性别是？</h2>
        <p className="text-sm text-muted-foreground">用于 AI 对你的称呼和代词引用</p>
      </div>
      <CardSelect
        options={options}
        value={data.userGender}
        onChange={(v) => update({ userGender: v })}
      />
    </div>
  );
}
