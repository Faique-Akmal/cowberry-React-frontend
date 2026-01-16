import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  Settings,
  Trash2,
  UserMinus,
  Users,
  Edit2,
  UserPlus,
  X,
  LogOut,
  Check,
} from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { ChatService } from "../../services/chatService";
import { User } from "../../types/chatTypes";
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
    addOrUpdateConversation,
  } = useChatStore();

  // --- UI States ---
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // --- Data States ---
  const [newGroupName, setNewGroupName] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === "GROUP";
  const otherUser = !isGroup
    ? activeConversation.participants.find((p) => p.user.id !== currentUser?.id)
        ?.user
    : null;
  const name = isGroup ? activeConversation.name : otherUser?.username;
  const image = isGroup
    ? `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`
    : otherUser?.profileImageUrl ||
      `https://ui-avatars.com/api/?name=${name}&background=random`;

  const isAdminOrManager =
    currentUser?.role?.name?.toLowerCase() === "admin" ||
    currentUser?.role?.name?.toLowerCase() === "manager" ||
    currentUser?.role?.name?.toLowerCase() === "hr";

  // --- Actions ---

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim()) return;
    setIsLoading(true);
    try {
      const { group } = await ChatService.updateGroup(activeConversation.id, {
        name: newGroupName,
      });
      addOrUpdateConversation(group); // Update store
      setActiveConversation(group); // Update current view
      toast.success("Group name updated");
      setShowEditModal(false);
    } catch (error) {
      toast.error("Update failed");
      console.error("ERROR ::: Update failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !confirm(
        "Are you sure? This will delete the group and all messages permanently."
      )
    )
      return;
    try {
      await ChatService.deleteGroup(activeConversation.id);
      removeConversation(activeConversation.id);
      setActiveConversation(null);
      toast.success("Group deleted");
    } catch (error) {
      toast.error("Delete failed");
      console.error("ERROR ::: Delete failed", error);
    }
  };

  const handleRemoveMember = async (userIdToRemove: number) => {
    if (!confirm("Remove this user from the group?")) return;
    try {
      const { group } = await ChatService.updateGroup(activeConversation.id, {
        removeParticipants: [userIdToRemove],
      });
      addOrUpdateConversation(group);
      setActiveConversation(group);
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
      console.error("ERROR ::: Failed to remove member", error);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    setIsLoading(true);
    try {
      const { group } = await ChatService.updateGroup(activeConversation.id, {
        addParticipants: selectedUsers,
      });
      addOrUpdateConversation(group);
      setActiveConversation(group);
      toast.success("Members added");
      setShowAddMemberModal(false);
      setSelectedUsers([]);
    } catch (error) {
      toast.error("Failed to add members");
      console.error("ERROR ::: Failed to add members", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersForAdd = async () => {
    try {
      const users: User[] = await ChatService.getAllUsers();
      // Filter out existing members
      const existingIds = activeConversation.participants.map((p) => p.user.id);
      setAllUsers(users.filter((u) => !existingIds.includes(u.id)));
      setShowAddMemberModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex h-20 items-center justify-between border-b border-white/10 bg-white/10 px-6 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden text-white p-1 hover:bg-white/10 rounded-full"
          >
            <ArrowLeft />
          </button>
          <img
            src={image}
            className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
            alt=""
          />
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {name}
            </h3>
            {isGroup ? (
              <span
                className="text-xs text-white/60 cursor-pointer hover:text-white/80"
                onClick={() => setShowMembersModal(true)}
              >
                {activeConversation.participants.length} members
              </span>
            ) : (
              <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>{" "}
                Online
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Common Actions */}
          <button className="p-2 hover:bg-white/10 rounded-full text-white/80 transition">
            <Phone className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full text-white/80 transition">
            <Video className="w-6 h-6" />
          </button>

          {/* Group Settings Dropdown */}
          {isGroup && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`p-2 rounded-full transition ${
                  showSettingsMenu
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10 text-white/80"
                }`}
              >
                <Settings className="w-6 h-6" />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 top-12 w-56 bg-[#1a1a1ae5] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right z-50">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowMembersModal(true);
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 rounded-lg transition"
                    >
                      <Users className="w-4 h-4 text-blue-400" /> Members
                    </button>

                    {isAdminOrManager && (
                      <>
                        <button
                          onClick={() => {
                            setNewGroupName(activeConversation.name || "");
                            setShowEditModal(true);
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4 text-yellow-400" /> Rename
                          Group
                        </button>

                        <button
                          onClick={() => {
                            fetchUsersForAdd();
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 rounded-lg transition"
                        >
                          <UserPlus className="w-4 h-4 text-green-400" /> Add
                          Members
                        </button>

                        <div className="h-px bg-white/10 my-1"></div>

                        <button
                          onClick={handleDeleteGroup}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Group
                        </button>
                      </>
                    )}

                    {!isAdminOrManager && (
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition">
                        <LogOut className="w-4 h-4" /> Leave Group
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Edit Name Modal */}
      {showEditModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1a1a1abe] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Rename Group</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-green-500 outline-none"
              placeholder="Group Name"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGroupName}
                disabled={isLoading}
                className="flex items-center justify-center gap-1 flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500"
              >
                <Edit2 className="w-4 h-4" /> Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Members List Modal */}
      {showMembersModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1a1a1abe] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                Group Members ({activeConversation.participants.length})
              </h3>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {activeConversation.participants.map((p) => (
                <div
                  key={p.user.id}
                  className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${p.user.username}`}
                      className="w-8 h-8 rounded-full border border-white/20"
                      alt=""
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {p.user.username}
                      </p>
                      {p.user.id === currentUser?.id && (
                        <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdminOrManager && p.user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleRemoveMember(p.user.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Members Modal */}
      {showAddMemberModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1a1a1abe] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col max-h-[80vh]">
            <h3 className="text-lg font-bold text-white mb-4">Add Members</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 mb-4 border border-white/10 rounded-xl p-2 bg-black/20">
              {allUsers.length === 0 ? (
                <p className="text-center text-white/50 text-sm py-4">
                  No users to add
                </p>
              ) : (
                allUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (selectedUsers.includes(user.id))
                        setSelectedUsers((prev) =>
                          prev.filter((id) => id !== user.id)
                        );
                      else setSelectedUsers((prev) => [...prev, user.id]);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                      selectedUsers.includes(user.id)
                        ? "bg-green-600/30 border border-green-500/50"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedUsers.includes(user.id)
                          ? "bg-brand-500 border-brand-500"
                          : "border-white/30"
                      }`}
                    >
                      {selectedUsers.includes(user.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-white/90 text-sm">
                      {user.username}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUsers([]);
                }}
                className="flex-1 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembers}
                disabled={isLoading || selectedUsers.length === 0}
                className="flex items-center justify-center gap-1 flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500"
              >
                <UserPlus className="w-4 h-4" /> Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
