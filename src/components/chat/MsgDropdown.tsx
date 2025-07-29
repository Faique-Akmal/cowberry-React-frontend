import React, { useCallback, useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { RiEdit2Line , RiDeleteBin6Line } from "react-icons/ri";
import { useSocketStore } from "../../store/socketStore";
import { useMessageStore } from "../../store/messageStore";

interface Props{
  chatGroupName?: string;
  msgId: number;
  // msg: ChatMessage;
  meUserId: number;
}

const MsgDropdown:React.FC<Props> = React.memo(({ msgId, meUserId}) => {
  const [isOpen, setIsOpen] = useState(false);
  const messages = useMessageStore((state) => state.messages.find((msg) => msg.id === msgId));
  const { sendJson } = useSocketStore();

  console.count("MsgDropdown rendered");

  // console.log(msgId);
  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

const handleDelete = useCallback(() => {
  sendJson({ type: "delete_message", message_id: msgId });
}, [msgId, sendJson]);

const handleEdit = useCallback((id: number, newContent: string) => {
  sendJson({ type: "edit_message", message_id: id, is_edited: true, new_content: newContent });
}, [sendJson]);

  return (
    <div>
      <button
        onClick={toggleDropdown}
        className="flex items-center bg-transparent px-1 rounded-full text-white dropdown-toggle dark:text-gray-400"
      >
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 flex w-[200px] flex-col rounded-2xl border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <ul className="custom-scrollbar overflow-y-auto overflow-hidden max-h-58 flex flex-col gap-1 pt-4 pb-3 ">

{/* <button onClick={() => handleEdit(msg.id, prompt("Edit message:", msg.content) || msg.content)}>
                     Edit
                   </button> */}

          {messages?.sender === meUserId && (
          <>
            {/* Edit Button */}
            <li className="pt-2 border-gray-200">
              <DropdownItem
                onItemClick={closeDropdown}
                tag="button"
                onClick={() => handleEdit(messages?.id, prompt("Edit message:", messages?.content) || messages?.content)}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 hover:text-dashboard-royalblue-200 dark:text-gray-400 rounded-lg group text-theme-sm hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <div className="text-xl">
                  <RiEdit2Line  />
                </div>
                <p className="capitalize">
                  Edit
                </p>
              </DropdownItem>
            </li>

            {/* Delete Button */}
            <li className="pt-2 border-t border-gray-200">
              <DropdownItem
                onItemClick={closeDropdown}
                tag="button"
                onClick={handleDelete}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 hover:text-delete dark:text-gray-400 rounded-lg group text-theme-sm hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <div className="text-lg">
                  <RiDeleteBin6Line />
                </div>
                <p className="capitalize">
                  Delete
                </p>
              </DropdownItem>
            </li>
          </>
          )}
          
        </ul>
      </Dropdown>
    </div>
  )
});

export default MsgDropdown