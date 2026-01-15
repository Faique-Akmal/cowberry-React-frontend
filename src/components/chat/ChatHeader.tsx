import { ArrowLeft, Phone, Video, Trash2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { ChatService } from "../../services/chatService";
import toast from "react-hot-toast";

interface Props {
  onBack: () => void;
}

export const ChatHeader = ({ onBack }: Props) => {
  const {
    activeConversation,
    currentUser,
    setActiveConversation,
    removeConversation,
  } = useChatStore();

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === "GROUP";
  const otherUser = !isGroup
    ? activeConversation.participants.find((p) => p.user.id !== currentUser?.id)
        ?.user
    : null;
  const name = isGroup ? activeConversation.name : otherUser?.username;
  const image = isGroup
    ? `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`
    : `https://ui-avatars.com/api/?name=${name}&background=random`;

  const handleDeleteGroup = async () => {
    if (!confirm("Delete this group permanently?")) return;
    try {
      await ChatService.deleteGroup(activeConversation.id);
      removeConversation(activeConversation.id);
      toast.success("Group deleted");
      setActiveConversation(null);
    } catch (e) {
      toast.error("Failed to delete");
      console.error("Failed to delete", e);
    }
  };

  return (
    <div className="flex h-20 items-center justify-between border-b border-white/10 bg-white/10 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden text-white p-1 hover:bg-white/10 rounded-full"
        >
          <ArrowLeft />
        </button>
        <img
          src={image}
          className="w-10 h-10 rounded-full border-2 border-white/30"
          alt=""
        />
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">{name}</h3>
          {isGroup ? (
            <span className="text-xs text-white/60">
              {activeConversation.participants.length} members
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-200 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>{" "}
              Online
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-white/10 rounded-full text-white/80 transition">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full text-white/80 transition">
          <Video className="w-5 h-5" />
        </button>

        {isGroup &&
          (currentUser?.role?.name?.toLowerCase() === "admin" ||
            currentUser?.role?.name?.toLowerCase() === "hr" ||
            currentUser?.role?.name?.toLowerCase() === "manager") && (
            <button
              onClick={handleDeleteGroup}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition"
              title="Delete Group"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
      </div>
    </div>
  );
};
