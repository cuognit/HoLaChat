import { useState, useEffect } from "react";
import { formatRelativeTime } from "../utils/timeUtils";

export function useRelativeTime(time, prefix = "") {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(time, prefix));

  useEffect(() => {
    // Update immediately when 'time' or 'prefix' changes
    setRelativeTime(formatRelativeTime(time, prefix));

    if (!time) return;

    // Set up interval to re-calculate every 60 seconds
    const intervalId = setInterval(() => {
      setRelativeTime(formatRelativeTime(time, prefix));
    }, 60000);

    return () => clearInterval(intervalId);
  }, [time, prefix]);

  return relativeTime;
}
