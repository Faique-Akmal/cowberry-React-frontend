// hooks/useTypingEmitter.ts
import { useRef } from "react";

export const useTypingEmitter = (
  sendTypingStatus: (isTyping: boolean) => void,
  delay: number = 2000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    // Send "is_typing": true
    sendTypingStatus(true);

    // Reset previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Auto-send "is_typing": false after delay
    timeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, delay);
  };

  return handleTyping;
};
