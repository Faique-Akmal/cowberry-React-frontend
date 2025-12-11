import React, { useEffect, useRef, useMemo, useState } from "react";

interface TypingIndicatorProps {
  typingUsers: Record<string, boolean>; // { username: true }
  currentUser?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = React.memo(({ typingUsers, currentUser }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeUsers = useMemo(() => {
    return Object.entries(typingUsers)
      .filter(([user, isTyping]) => isTyping && user !== currentUser)
      .map(([user]) => user);
  }, [typingUsers, currentUser]);

  useEffect(() => {
    if (activeUsers.length > 0) {
      setVisible(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 4000);
    } else {
      setVisible(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeUsers]);

  if (!visible || activeUsers.length === 0) return null;

  return (
    <div className="text-xs text-gray-500 flex items-center">
      <span>
        <em>{activeUsers.join(", ")} typing...</em>
      </span>
    </div>
  );
});

TypingIndicator.displayName = "TypingIndicator";

export default TypingIndicator;
