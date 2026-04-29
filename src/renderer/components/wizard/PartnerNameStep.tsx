import { Input } from "../ui/input";

export default function PartnerNameStep({
  data, update,
}: {
  data: { name: string };
  update: (d: Partial<{ name: string }>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="text-lg font-semibold">她叫什么名字？</h2>
        <p className="text-sm text-muted-foreground">给 TA 取一个你喜欢的名字</p>
      </div>
      <Input
        type="text"
        value={data.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="输入名字..."
        autoFocus
      />
    </div>
  );
}
