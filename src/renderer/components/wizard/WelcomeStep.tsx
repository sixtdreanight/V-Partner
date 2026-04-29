import { Heart } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export default function WelcomeStep({ next }: { next: () => void }) {
  return (
    <div className="text-center space-y-10">
      <div className="space-y-5">
        <div
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/20"
          style={{ background: "linear-gradient(135deg, var(--vp-primary-soft), #ede9fe)" }}
        >
          <Heart className="w-9 h-9 text-primary" fill="currentColor" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">V-Partner</h1>
          <p className="text-sm text-muted-foreground">创建属于你的 AI 伴侣</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="primary">记住你的一切</Badge>
          <Badge variant="outline">陪聊倾诉</Badge>
          <Badge variant="outline">QQ 机器人</Badge>
        </div>
      </div>

      <Button variant="primary" size="lg" className="w-full" onClick={next}>
        开始设置
      </Button>

      <p className="text-[11px] text-muted-foreground">14 步简单配置，约 2 分钟完成</p>
    </div>
  );
}
