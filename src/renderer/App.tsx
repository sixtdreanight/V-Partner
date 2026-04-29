import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import SetupWizard from "./pages/SetupWizard";
import ChatWindow from "./pages/ChatWindow";
import ErrorBoundary from "./components/shared/ErrorBoundary";

export default function App() {
  const [appearance, setAppearance] = useState<"light" | "dark">(
    () => document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = e.matches;
      document.documentElement.classList.toggle("dark", isDark);
      setAppearance(isDark ? "dark" : "light");
    };
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <ErrorBoundary>
      <Theme accentColor="pink" grayColor="slate" radius="medium" appearance={appearance}>
        <HashRouter>
          <Routes>
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="/chat" element={<ChatWindow />} />
            <Route path="*" element={<Navigate to="/setup" replace />} />
          </Routes>
        </HashRouter>
      </Theme>
    </ErrorBoundary>
  );
}
