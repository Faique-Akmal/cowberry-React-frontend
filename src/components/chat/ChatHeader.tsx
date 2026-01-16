import { ArrowLeft, Phone, Video, Trash2, MoreVertical } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { ChatService } from "../../services/chatService";
import toast from "react-hot-toast";
import { useState } from "react";

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
  const [activeMenu, setActiveMenu] = useState(false);

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

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(!activeMenu);
  };

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
    <div className="relative z-100 flex h-20 items-center justify-between border-b border-white/10 bg-white/10 px-6 backdrop-blur-md">
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
            <>
              <button
                onClick={handleMenuClick}
                className="p-2 hover:bg-white/10 rounded-full text-white/80 transition"
                title="Group info"
              >
                <MoreVertical className="w-5 h-5 text-white/70" />
              </button>
              {activeMenu && (
                <div
                  className="absolute top-18 right-6 z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-1 animate-in zoom-in-95"
                  onMouseLeave={() => setActiveMenu(false)}
                >
                  <div className="flex gap-2 flex-col py-2">
                    <h1 className="text-white text-xl text-center">
                      {activeConversation.name}
                    </h1>
                    <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-t border-gray-200 dark:border-gray-800">
                      {activeConversation.participants.map((p) => (
                        <li
                          key={p.id}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg text-gray-200 hover:bg-white/10"
                        >
                          <p>{p.user.username}</p>
                          <button
                            onClick={() => {
                              // setActiveMenu(false);
                            }}
                          >
                            Remove member
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleDeleteGroup}
                      className="flex items-center justify-center w-full gap-2 py-2 px-4 hover:bg-red-500/20 text-red-400 rounded-full transition"
                      title="Delete Group"
                    >
                      <Trash2 className="w-5 h-5" /> Delete Group
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
};
