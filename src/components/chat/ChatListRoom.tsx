import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { axiosPostCreateGroup, AxiosAllGroup } from "../../store/chatStore";
import LastChatMsg from "./LastChatMsg";
import Alert from "../ui/alert/Alert";
import Avatar from "../ui/avatar/Avatar";
import InfiniteScrollList from "../common/InfiniteScrollList";

interface Props {
  groups: AxiosAllGroup[];
  activeChatId: number;
  onSelectChat: (id: number) => void;
}

const ChatListRoom: React.FC<Props> = ({ groups, activeChatId, onSelectChat }) => {
  const { isOpen, openModal, closeModal } = useModal();
  const [groupName, setGroupName] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axiosPostCreateGroup({
        name: groupName.trim(),
        members: selectedValues,
      });

      setGroupName('');
      setSelectedValues([]);
      closeModal();
    } catch (err) {
      console.error("Group creation failed:", err);
    }
  };

  return (
    <>
      <div className="w-full bg-dashboard-brown-200 h-[80vh]">
        {/* Create Group Button */}
        <div className="flex justify-end items-center h-17 p-2">
          <button
            onClick={openModal}
            className="flex gap-2 items-center rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z"
              />
            </svg>
            Create Group
          </button>
        </div>

        {/* Group List */}
        <div className="h-full py-2 overflow-y-auto custom-scrollbar">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center">
              <Alert
                variant="warning"
                title="Chat Group Not Found!"
                message="Try again later!"
                showLink={false}
              />
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div
                  key={group.group_id}
                  onClick={() => onSelectChat(group.group_id)}
                  className={`flex gap-2 mx-2 my-1 rounded-xl p-4 cursor-pointer text-white hover:opacity-75 ${
                    activeChatId === group.group_id
                      ? "bg-brand-500"
                      : "bg-cowberry-cream-500"
                  }`}
                >
                  <Avatar src="/images/user/user-01.jpg" size="large" />
                  <div>
                    <h3 className="font-semibold">{group.group_name}</h3>
                    <div className="text-sm text-dashboard-brown-200">
                      <LastChatMsg groupId={group.group_id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="w-full max-w-none m-0 fixed inset-0 flex items-center justify-center"
      >
        <div className="w-full h-[50vh] max-w-xl overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Create Chat Group
          </h4>
          <form onSubmit={handleSave}>
            <div className="space-y-5">
              <div>
                <Label>Group Name</Label>
                <Input
                  type="text"
                  name="group_name"
                  placeholder="Enter new group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <InfiniteScrollList
                onChange={(values) => setSelectedValues(values)}
                selectedValues={selectedValues}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default ChatListRoom;
