import { useState, useEffect } from "react";
import { Heart, Settings, MessageCircle, MessageSquare } from "lucide-react";
import { Flex, Text, IconButton } from "@radix-ui/themes";
import { useChat } from "../hooks/useChat";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import SettingsDialog from "../components/shared/SettingsDialog";
import UpdateToast from "../components/shared/UpdateToast";
import SurveyDialog, { shouldShowSurvey } from "../components/shared/SurveyDialog";
import NapCatSetup from "./NapCatSetup";
import WeChatSetup from "./WeChatSetup";
import TitleBar from "../components/shared/TitleBar";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

export default function ChatWindow() {
  const { messages, typing, profile, messagesEndRef, sendMessage } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [showNapCat, setShowNapCat] = useState(false);
  const [showWeChat, setShowWeChat] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [time, setTime] = useState("");
  const [avatarData, setAvatarData] = useState<string | null>(null);

  useEffect(() => {
    window.api.getAvatar().then((d: unknown) => setAvatarData(d as string | null));
  }, []);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    const t = setInterval(
      () => setTime(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })),
      30000
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "partner") {
      if (shouldShowSurvey()) {
        setShowSurvey(true);
      }
    }
  }, [messages]);

  if (showNapCat) {
    return <NapCatSetup onBack={() => setShowNapCat(false)} />;
  }
  if (showWeChat) {
    return <WeChatSetup onBack={() => setShowWeChat(false)} />;
  }

  const name = (profile?.name as string) || "V-Partner";

  return (
    <Flex direction="column" height="100vh" className="page-enter"
      style={{ background: "var(--vp-bg-chat)" }}>
      <UpdateToast />

      <TitleBar>
        <Flex align="center" gap="3">
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%", overflow: "hidden",
              cursor: "pointer", background: "var(--accent-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            onClick={async () => {
              const data = await window.api.pickAvatar();
              if (data) setAvatarData(data as string);
            }}
          >
            {avatarData ? (
              <img src={avatarData} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Heart size={16} style={{ color: "var(--primary)" }} fill="currentColor" />
            )}
          </div>
          <Flex align="center" gap="2">
            <Text size="2" weight="medium">{name}</Text>
            <Text size="1" style={{ fontFamily: "var(--default-font-family)", color: "var(--green-9)", letterSpacing: "0.05em" }}>
              ONLINE
            </Text>
          </Flex>
        </Flex>

        <Flex align="center" gap="3">
          <Text size="1" color="gray" style={{ fontFamily: "var(--default-font-family)" }}>{time}</Text>
          <Flex align="center" gap="1" style={{ WebkitAppRegion: "no-drag", cursor: "pointer" }}
            onClick={() => setShowNapCat(true)}>
            <MessageCircle size={16} />
            <Text size="1" color="gray">QQ</Text>
          </Flex>
          <Flex align="center" gap="1" style={{ WebkitAppRegion: "no-drag", cursor: "pointer" }}
            onClick={() => setShowWeChat(true)}>
            <MessageSquare size={16} />
            <Text size="1" color="gray">微信</Text>
          </Flex>
          <Flex align="center" gap="1" style={{ WebkitAppRegion: "no-drag", cursor: "pointer" }}
            onClick={() => setShowSettings(true)}>
            <Settings size={16} />
            <Text size="1" color="gray">设置</Text>
          </Flex>
        </Flex>
      </TitleBar>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 40px",
          maxWidth: 768,
          margin: "0 auto",
          width: "100%",
        }}>
          <MessageList messages={messages} typing={typing} messagesEndRef={messagesEndRef} />
        </div>

        <div style={{ borderTop: "1px solid var(--gray-3)", background: "var(--color-background)" }}>
          <div style={{ maxWidth: 768, margin: "0 auto", width: "100%" }}>
            <MessageInput onSend={sendMessage} disabled={typing} />
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}

      {showSurvey && <SurveyDialog onClose={() => setShowSurvey(false)} />}
    </Flex>
  );
}
