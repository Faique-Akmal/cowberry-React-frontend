import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { User } from "../../types/chatTypes";
import { ChatService } from "../../services/chatService";
import { useChatStore } from "../../store/useChatStore";
import toast from "react-hot-toast";

interface Props {
  users: User[];
  onClose: () => void;
}

export const CreateGroupModal = ({ users, onClose }: Props) => {
  const { addOrUpdateConversation, currentUser } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0)
      return toast.error("Details missing");

    setLoading(true);
    try {
      const { group } = await ChatService.createGroup({
        name: groupName,
        participantIds: selectedUsers,
      });
      addOrUpdateConversation(group);
      toast.success("Group created!");
      onClose();
    } catch (err) {
      toast.error("Group Creation failed");
      console.error("Creation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mt-1 focus:border-lime-500 outline-none transition"
              placeholder="Group name"
            />
          </div>

          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider">
              Select Members
            </label>
            <div className="mt-1 max-h-48 overflow-y-auto space-y-1 custom-scrollbar border border-white/10 rounded-xl p-2 bg-black/20">
              {users
                .filter((u) => u.id !== currentUser?.id)
                .map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (selectedUsers.includes(user.id))
                        setSelectedUsers((prev) =>
                          prev.filter((id) => id !== user.id)
                        );
                      else setSelectedUsers((prev) => [...prev, user.id]);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                      selectedUsers.includes(user.id)
                        ? "bg-green-600/30 border border-green-500/50"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                        selectedUsers.includes(user.id)
                          ? "bg-green-500 border-green-500"
                          : "border-white/30"
                      }`}
                    >
                      {selectedUsers.includes(user.id) && (
                        <CheckCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-white/90 text-sm">
                      {user.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-500 transition font-medium shadow-lg shadow-lime-500/20"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
