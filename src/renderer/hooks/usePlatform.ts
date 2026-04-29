import { useState, useEffect } from "react";

export function usePlatform() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(window.api.getPlatform() === "darwin");
  }, []);
  return { isMac };
}
