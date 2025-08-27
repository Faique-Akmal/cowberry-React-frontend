import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { axiosPostCreateGroup, AxiosAllGroup } from "../../store/chatStore"
// import MultiSelect from "../form/MultiSelect";
// import { axiosGetUsers, AxiosGetUsers } from "../../store/userStore";
import LastChatMsg from "./LastChatMsg";
// import Alert from "../ui/alert/Alert";
import Avatar from "../ui/avatar/Avatar";
import InfiniteScrollList from "../common/InfiniteScrollList";
import ChatUserList from "./ChatUserList";
import { ActiveChatInfo } from "../../types/chat";

interface Props {
  groups: AxiosAllGroup[];
  activeChatInfo: ActiveChatInfo;
  onSelectChat: (activeInfo: ActiveChatInfo) => void;
}


const ChatList: React.FC<Props> = ({ groups, activeChatInfo, onSelectChat }) => {
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
        <div className="flex justify-end items-center text-end h-17 p-2">
          <button
            onClick={openModal}
            className="flex w-fit items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Create Group
          </button>
        </div>

        <div className="h-full py-2 custom-scrollbar overflow-y-auto overflow-hidden">
          {/* {groups?.length <= 0 ?
            <div className="flex items-center justify-center">
              <Alert
                variant="warning"
                title="Chat Group Not Found!"
                message="Try again later!"
                showLink={false}
              />
            </div>
            : */}
          {groups?.length > 0 &&
            <div>

              {/* groups chat lists */}
              {groups?.map((group) => (
                <div
                  key={group?.group_id}
                  onClick={() => onSelectChat({
                    chatId: group?.group_id,
                    chatType: "group",
                    chatName: group?.group_name
                  })}
                  className={`lg:max-w-80 flex gap-2 mx-2 my-1 rounded-xl p-4 cursor-pointer text-white hover:opacity-75 ${(activeChatInfo?.chatType === "group") && (activeChatInfo?.chatId === group?.group_id) ? "bg-brand-500" : "bg-cowberry-cream-500"}`}
                >
                  <span className="mr-3">
                    <Avatar src="/images/user/user-01.jpg" size="large"
                    // newClassName="overflow-hidden"
                    />
                  </span>
                  <div className="w-full truncate">
                    <h3 className="font-semibold truncate">{group?.group_name}</h3>
                    <div className="text-sm text-dashboard-brown-200">
                      <LastChatMsg groupId={group?.group_id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
          {/* user chat lists */}
          <div>
            <ChatUserList activeChatInfo={activeChatInfo} onSelectChat={onSelectChat} />
          </div>

        </div>


      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4 -translate-y-12 lg:translate-y-0">
        <div className="relative no-scrollbar w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-4">
          <div className="px-2 pr-14">
            <h4 className="mt-4 mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Create Chat Group
            </h4>
          </div>
          <form className="flex flex-col">
            <div className="lg:h-[35vh] px-2 pb-3">
              <div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5">
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

                  <div>
                    <InfiniteScrollList
                      onChange={(values) => setSelectedValues(values)}
                      selectedValues={selectedValues}
                    />

                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-center">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Create
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}

export default ChatList
