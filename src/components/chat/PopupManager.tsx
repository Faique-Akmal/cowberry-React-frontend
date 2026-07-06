import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessagePopup } from "./MessagePopup";
import { Message, User } from "../../types/chatTypes";

interface PopupMessage {
  id: string;
  message: Message;
  sender: User;
}

interface PopupManagerProps {
  popups: PopupMessage[];
  onClose: (id: string) => void;
  onClick: (message: Message, sender: User) => void;
}

export const PopupManager: React.FC<PopupManagerProps> = ({
  popups,
  onClose,
  onClick,
}) => {
  if (popups.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
      {popups.map((popup) => (
        <div key={popup.id} className="pointer-events-auto">
          <MessagePopup
            message={popup.message}
            sender={popup.sender}
            onClose={() => onClose(popup.id)}
            onClick={() => onClick(popup.message, popup.sender)}
          />
        </div>
      ))}
    </div>,
    document.body,
  );
};
