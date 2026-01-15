import React, { useState } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  Edit2,
  Trash2,
  CornerUpLeft,
  Ban,
  CheckCheck,
  FileText,
  Download,
  MapPin,
} from "lucide-react";
import { Message } from "../../types/chatTypes";
import { useChatStore } from "../../store/useChatStore";

const BASE_URL = import.meta.env.VITE_FILE_URL || "http://localhost:5000";

const getFullUrl = (path: string | undefined) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${BASE_URL}${path}`;
};

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  onDelete: (id: number) => void;
  isGroup: boolean;
}

// React.memo use kiya taaki parent re-render hone per ye dubara render na ho
const MessageBubble = React.memo(
  ({ msg, isMe, onDelete, isGroup }: MessageBubbleProps) => {
    const [activeMenu, setActiveMenu] = useState(false);
    const { setReplyingTo, setEditingMessage } = useChatStore();

    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveMenu(!activeMenu);
    };

    // --- Attachment Renderers ---
    const renderAttachment = () => {
      const fullUrl = getFullUrl(msg.fileUrl);

      if (msg.type === "IMAGE") {
        return (
          <div className="mb-2 overflow-hidden rounded-lg border border-white/20 cursor-pointer group/img">
            <img
              src={fullUrl}
              alt="attachment"
              loading="lazy"
              className="max-h-60 w-full object-cover transition-transform hover:scale-105"
              onClick={() => window.open(fullUrl, "_blank")}
            />
          </div>
        );
      }
      if (msg.type === "VIDEO") {
        return (
          <div className="mb-2 overflow-hidden rounded-lg border border-white/20 bg-black">
            <video
              src={fullUrl}
              controls
              muted
              className="max-h-60 rounded-lg"
            />
          </div>
        );
      }
      if (msg.type === "LOCATION") {
        const [lat, lng] = (msg.content || "").split(",");
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        return (
          <div className="mb-2 rounded-lg border border-white/20 bg-black/20 p-2">
            <div className="flex items-center gap-2 mb-2 text-white/90 font-medium">
              <MapPin className="w-5 h-5 text-red-500" /> <span>Location</span>
            </div>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-300 hover:underline"
            >
              Open Maps
            </a>
          </div>
        );
      }
      // Docs
      return (
        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/10 hover:bg-black/30 transition">
          <FileText className="text-blue-300 w-8 h-8" />
          <div className="flex-1 truncate text-sm text-white">
            {msg.content}
          </div>
          <a
            href={fullUrl}
            target="_blank"
            download
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <Download className="w-4 h-4 text-white" />
          </a>
        </div>
      );
    };

    return (
      <div
        className={`flex flex-col ${
          isMe ? "items-end" : "items-start"
        } animate-in slide-in-from-bottom-2 duration-300 mb-4`}
      >
        <div
          className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-lg group ${
            isMe
              ? "bg-indigo-600 text-white rounded-br-none"
              : "bg-white/10 text-white rounded-bl-none border border-white/10"
          }`}
        >
          {/* Sender Name in Group */}
          {isGroup && (
            <p className="text-[10px] text-orange-300 font-bold mb-1 opacity-80">
              {!isMe ? msg.sender.username : `${msg.sender.username} (You)`}
            </p>
          )}

          {/* Reply Context */}
          {msg.replyTo && (
            <div className="mb-2 p-2 rounded-lg bg-black/20 text-xs border-l-2 border-white/50 opacity-80 flex flex-col">
              <span className="font-bold text-indigo-300">
                {msg.replyTo.sender?.username || "User"}
              </span>
              <span className="truncate">
                {msg.replyTo.content || "Attachment"}
              </span>
            </div>
          )}

          {/* Content */}
          {msg.isDeleted ? (
            <p className="italic text-sm opacity-60 flex items-center gap-2">
              <Ban className="w-4 h-4" /> Message deleted
            </p>
          ) : (
            <>
              {msg.type !== "TEXT" && renderAttachment()}
              {msg.content &&
                msg.type !== "LOCATION" &&
                msg.type !== "DOCUMENT" && (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}
            </>
          )}

          {/* Footer */}
          <div className="text-[10px] text-white/50 text-right mt-1 flex items-center justify-end gap-1">
            {format(new Date(msg.createdAt), "HH:mm")}
            {msg.isEdited && <span>(edited)</span>}
            {!msg.isDeleted && isMe && (
              <CheckCheck className="w-3 h-3 text-blue-200" />
            )}
          </div>

          {/* Hover Menu */}
          {!msg.isDeleted && (
            <div
              className={`absolute top-2 ${
                isMe ? "left-2" : "right-2"
              } opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <button
                onClick={handleMenuClick}
                className="p-1 hover:bg-black/20 rounded-full"
              >
                <MoreVertical className="w-4 h-4 text-white/70" />
              </button>

              {activeMenu && (
                <div
                  className="absolute top-6 z-50 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 w-32 animate-in zoom-in-95"
                  onMouseLeave={() => setActiveMenu(false)}
                >
                  <button
                    onClick={() => {
                      setReplyingTo(msg);
                      setActiveMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
                  >
                    <CornerUpLeft className="w-3 h-3" /> Reply
                  </button>
                  {isMe && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMessage(msg);
                          setActiveMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(msg.id);
                          setActiveMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default MessageBubble;
