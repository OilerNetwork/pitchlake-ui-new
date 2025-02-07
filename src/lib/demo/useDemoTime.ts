import { useState, useEffect } from "react";

export const useDemoTime = (active: boolean, intervalMS = 15000): number => {
  const [demoNow, setDemoNow] = useState<number>(
    () => new Date().getTime() / 1000,
  );

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setDemoNow(new Date().getTime() / 1000);
    }, intervalMS);
    return () => clearInterval(interval);
  }, [active, intervalMS]);

  return Number(demoNow.toFixed(0));
};
