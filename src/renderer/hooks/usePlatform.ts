import { useState, useEffect } from "react";

export function usePlatform() {
  const [platform, setPlatform] = useState<string>("unknown");
  useEffect(() => {
    setPlatform(window.api.getPlatform());
  }, []);
  return platform;
}
