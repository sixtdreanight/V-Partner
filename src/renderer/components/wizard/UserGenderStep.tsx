import { User, Users } from "lucide-react";
import CardSelect from "../shared/CardSelect";

const options = [
  { value: "male" as const, label: "男生", desc: "TA 会成为你的女友" },
  { value: "female" as const, label: "女生", desc: "TA 会成为你的男友" },
  { value: "other" as const, label: "其他", desc: "性别不限" },
];

export default function UserGenderStep({
  data, update,
}: {
  data: { userGender: string };
  update: (d: Partial<{ userGender: string; relationshipType: string; nickname: string }>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="text-lg font-semibold">你的性别是？</h2>
        <p className="text-sm text-muted-foreground">这会影响 TA 如何称呼你和互动</p>
      </div>
      <CardSelect
        options={options}
        value={data.userGender}
        onChange={(v) => {
          update({
            userGender: v,
            relationshipType: v === "male" ? "girlfriend" : "boyfriend",
            nickname: v === "female" ? "宝宝" : "宝贝",
          });
        }}
      />
    </div>
  );
}
