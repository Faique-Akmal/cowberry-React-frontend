import React, { useState } from "react";
import { format } from "date-fns";
import {
  Edit2,
  Trash2,
  CornerUpLeft,
  Ban,
  CheckCheck,
  FileText,
  Download,
  MapPinned,
  Telescope,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Message } from "../../types/chatTypes";
import { useChatStore } from "../../store/useChatStore";

const BASE_URL = import.meta.env.VITE_FILE_URL;

const getFullUrl = (path: string | undefined) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${BASE_URL}${path}`;
};

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  onDelete: (id: number) => void;
  isGroup?: boolean;
}

// React.memo use kiya taaki parent re-render hone per ye dubara render na ho
const MessageBubble = React.memo(
  ({ msg, isMe, onDelete }: MessageBubbleProps) => {
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
          <div className="overflow-hidden rounded-lg border border-white/20 bg-black/20">
            <div className="flex justify-center items-center gap-2 text-white/90 font-medium relative">
              <img
                src={`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=450,250&z=15&l=map&pt=${lng},${lat},pm2rdm`}
                alt="Location Preview"
                className="w-full h-40 object-cover rounded-tl rounded-tr"
              />{" "}
            </div>
            <div className="p-2 flex flex-col items-center">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                <button className="mx-auto overflow-hidden relative w-32 h-8 bg-brand-500 text-white border-none rounded-md text-sm font-bold cursor-pointer z-10 group">
                  <span className="flex items-center justify-center gap-1">
                    <MapPinned className="w-5 h-5" /> Open map
                  </span>
                  <span className="absolute w-36 h-32 -top-8 -left-2 bg-white rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-left" />
                  <span className="absolute w-36 h-32 -top-8 -left-2 bg-green-400 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-left" />
                  <span className="absolute w-36 h-32 -top-8 -left-2 bg-green-600 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-left" />
                  <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.5 left-6 z-10">
                    <span className="flex items-center justify-center gap-1">
                      <Telescope className="w-5 h-5" /> Explore!
                    </span>
                  </span>
                </button>
              </a>
            </div>
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
          className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3 pt-3 pb-1 shadow-lg group ${
            isMe
              ? "bg-linear-to-br from-black/20 to-white/20 text-white rounded-br-none border border-white/10"
              : "bg-linear-to-br from-green-600/50 to-brand-600/50 text-white rounded-tl-none border border-white/20"
          }`}
        >
          <p className="text-xs text-gray-100 font-bold mb-1 opacity-80">
            {isMe ? `${msg.sender.username} (You)` : msg.sender.username}
          </p>

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
              <Ban className="w-4 h-4" />{" "}
              {isMe ? "You deleted this message" : "This message was deleted"}
            </p>
          ) : msg.type === "TEXT" ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>
          ) : (
            renderAttachment()
          )}

          {/* Footer */}
          <div className="text-[10px] text-white/50 text-right mt-1 flex items-center justify-end gap-1">
            {format(new Date(msg.createdAt), "HH:mm")}
            {msg.isEdited && <span>(edited)</span>}
            {!msg.isDeleted && isMe && (
              <CheckCheck className="w-4 h-4 text-blue-light-400" />
            )}
          </div>

          {/* Hover Menu */}
          {!msg.isDeleted && (
            <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleMenuClick}
                className="p-1 hover:bg-black/20 rounded-full"
              >
                {activeMenu ? (
                  <ChevronUp className="h-5 w-5 text-white/70" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/70" />
                )}
              </button>

              {activeMenu && (
                <div
                  className={`absolute top-6 ${
                    isMe ? "right-0" : "left-0"
                  } z-50 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-1 w-32 animate-in zoom-in-95`}
                  onMouseLeave={() => setActiveMenu(false)}
                >
                  <button
                    onClick={() => {
                      setReplyingTo(msg);
                      setActiveMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg text-gray-200 hover:bg-white/10"
                  >
                    <CornerUpLeft className="w-3 h-3" /> Reply
                  </button>
                  {isMe && (
                    <>
                      {msg.type !== "LOCATION" && (
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setActiveMenu(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg text-gray-200 hover:bg-white/10"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDelete(msg.id);
                          setActiveMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-500/20 text-red-400"
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
  },
);

export default MessageBubble;
