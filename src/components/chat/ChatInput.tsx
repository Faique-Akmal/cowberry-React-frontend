import React, { useRef, useState } from "react";
import {
  Send,
  BadgePlus,
  X,
  Image as ImageIcon,
  FileText,
  MapPin,
  Loader2,
} from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { ChatService } from "../../services/chatService";
import toast from "react-hot-toast";

export const ChatInput = () => {
  const {
    activeConversation,
    currentUser,
    replyingTo,
    editingMessage,
    setReplyingTo,
    setEditingMessage,
  } = useChatStore();
  const { socket } = useSocketStore();

  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isSendingLocation, setIsSendingLocation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Sync input with editing state
  React.useEffect(() => {
    if (editingMessage) setInput(editingMessage.content || "");
  }, [editingMessage]);

  const handleSendMessage = () => {
    if (!input.trim() || !activeConversation || !currentUser || !socket) return;

    if (editingMessage) {
      socket.emit("edit_message", {
        messageId: editingMessage.id,
        newContent: input,
        conversationId: activeConversation.id,
      });
      setEditingMessage(null);
    } else {
      const payload = {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content: input,
        type: "TEXT",
        replyToId: replyingTo?.id || null,
      };
      socket.emit("send_message", payload);
      setReplyingTo(null);
    }
    setInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation || !currentUser || !socket) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File exceeds 100MB limit");
      return;
    }

    try {
      setIsUploading(true);
      const { fileUrl, type } = await ChatService.uploadFile(file);

      let msgType = "DOCUMENT";
      if (type.startsWith("image/")) msgType = "IMAGE";
      if (type.startsWith("video/")) msgType = "VIDEO";

      socket.emit("send_message", {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content: file.name,
        type: msgType,
        fileUrl: fileUrl,
      });
      setIsAttachMenuOpen(false);
    } catch (err) {
      toast.error("Upload failed");
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");

    setIsSendingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        socket?.emit("send_message", {
          conversationId: activeConversation?.id,
          senderId: currentUser?.id,
          content: `${latitude},${longitude}`,
          type: "LOCATION",
          replyToId: replyingTo?.id || null,
        });
        setIsSendingLocation(false);
        setReplyingTo(null);
        setIsAttachMenuOpen(false);
        toast.success("Location sent!");
      },
      () => {
        setIsSendingLocation(false);
        toast.error("Location access denied");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative z-100 p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
      {/* Reply/Edit Banner */}
      {(replyingTo || editingMessage) && (
        <div className="absolute bottom-full left-0 w-full bg-[#1a1a1aa3] backdrop-blur-3xl shadow-xl p-3 rounded-tr-lg rounded-tl-lg border-t border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-5">
          <div className="flex flex-col rounded-tl-sm py-1 rounded-bl-sm border-l-5 border-brand-500 pl-3">
            <span className="text-xs text-brand-300 font-bold">
              {editingMessage
                ? "Editing Message"
                : `Replying to ${replyingTo?.sender.username}`}
            </span>
            <span className="text-sm text-white/70 truncate max-w-md">
              {editingMessage
                ? editingMessage.content
                : replyingTo?.content || "Attachment"}
            </span>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setInput("");
            }}
            className="p-1 hover:bg-white/10 rounded-full"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-black/20 rounded-full p-1.5 border border-white/10">
        {/* Attachment Menu */}
        <div className="relative">
          <button
            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
            className={`p-2 rounded-full transition ${
              isAttachMenuOpen
                ? "bg-white/20 text-white rotate-45"
                : "text-white/60 hover:text-white"
            }`}
          >
            <BadgePlus className="h-6 w-6" />{" "}
          </button>

          {isAttachMenuOpen && (
            <div className="absolute bottom-14 left-0 bg-[#1c1c1c]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-44 shadow-2xl flex flex-col gap-1 animate-in zoom-in-95 origin-bottom-left z-50">
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white/90 text-sm transition"
              >
                <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400">
                  <ImageIcon className="w-4 h-4" />
                </div>{" "}
                Photos & Video
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white/90 text-sm transition"
              >
                <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>{" "}
                Document
              </button>
              <button
                onClick={handleSendLocation}
                className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white/90 text-sm transition"
              >
                <div className="p-1.5 bg-green-500/20 rounded-lg text-green-400">
                  <MapPin className="w-4 h-4" />
                </div>{" "}
                Location
              </button>
            </div>
          )}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          className="flex-1 bg-transparent outline-none text-white px-2 placeholder-white/30"
        />

        {isUploading || isSendingLocation ? (
          <div className="p-2">
            <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
          </div>
        ) : (
          <button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className={`p-2 rounded-full transition ${
              input.trim()
                ? "bg-linear-to-r from-green-300/50 to-green-500/30 text-white"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        )}

        <input
          type="file"
          ref={mediaInputRef}
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileUpload}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};
