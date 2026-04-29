import { Input } from "../ui/Input";

export default function UserCityStep({
  data, update,
}: {
  data: { userCity: string };
  update: (d: Partial<{ userCity: string }>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="text-lg font-semibold">你在哪个城市？</h2>
        <p className="text-sm text-muted-foreground">TA 会和你聊天气、本地话题</p>
      </div>
      <Input
        type="text"
        value={data.userCity}
        onChange={(e) => update({ userCity: e.target.value })}
        placeholder="例如：北京"
        autoFocus
      />
    </div>
  );
}
