import React, { useCallback, useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { RiReplyLine, RiFileCopyLine, RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import { useSocketStore } from "../../store/socketStore";
import { useMessageStore } from "../../store/messageStore";
import { copyToClipboard } from "../../utils/clipboard";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import toast from "react-hot-toast";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import TimeZone from "../common/TimeZone";
import { ActiveChatInfo, ChatMessage } from "../../types/chat";

interface Props {
  chatGroupName?: ActiveChatInfo;
  msgId: number;
  meUserId: number;
  replyMsg: (msg: ChatMessage) => void;
}

const MsgDropdown: React.FC<Props> = React.memo(({ msgId, meUserId, replyMsg }) => {
  const { isOpen, openModal, closeModal } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const { sendJson } = useSocketStore();
  const { getMessageById } = useMessageStore();
  const message = getMessageById(msgId);

  const [loading, setLoading] = useState(false);

  // console.count("MsgDropdown rendered");

  function toggleDropdown() {
    setIsDropdownOpen(!isDropdownOpen);
  }

  function closeDropdown() {
    setIsDropdownOpen(false);
  }

  const handleReply = useCallback(() => {
    try {
      replyMsg(message!);
    } catch (error) {
      console.error(error);
      toast.error('Failed to reply message');
    }
  }, [replyMsg, message]);

  const handleCopy = (msgContent: string) => {
    copyToClipboard(msgContent);
  }

  const handleEditOpen = () => {
    setEditedMessage(message?.content || "");
    openModal();
  };


  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editedMessage.trim()) return;

    setLoading(true);

    if (editedMessage.trim()) {
      try {
        await sendJson({
          type: "edit_message",
          message_id: msgId,
          is_edited: true,
          new_content: editedMessage.trim()
        });
        toast.success('Message edited (live)')
        closeModal();
        setEditedMessage("");
      } catch (error) {
        console.error(error);
        toast.error('Failed to edit message');
      } finally {
        setLoading(false);
      }
    }
  }

  const handleDelete = useCallback(() => {
    try {
      sendJson({ type: "delete_message", message_id: msgId });
      toast.success('Message deleted (live)', {
        style: {
          border: '1px solid #FA99A4',
          padding: '16px',
          color: '#FA99A4',
        },
        iconTheme: {
          primary: '#FA99A4',
          secondary: '#FFFAEE',
        },
      })
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete message');
    }
  }, [msgId, sendJson]);

  if (!message) return null;

  return (
    <>
      <div>
        <button
          onClick={toggleDropdown}
          className="flex items-center bg-transparent px-1 rounded-full text-white dropdown-toggle dark:text-gray-400"
        >
          <svg
            className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
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
          isOpen={isDropdownOpen}
          onClose={closeDropdown}
          className="absolute right-0 flex max-w-[150px] flex-col rounded-2xl border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
        >
          <ul className="custom-scrollbar overflow-y-auto overflow-hidden max-h-58 flex flex-col gap-1 pt-2 pb-3 ">

            {/* Reply Button */}
            <li className="pt-2 border-gray-200">
              <DropdownItem
                onItemClick={closeDropdown}
                tag="button"
                onClick={handleReply}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 hover:text-dashboard-royalblue-200 dark:text-gray-400 rounded-lg group text-theme-sm hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <div className="text-xl">
                  <RiReplyLine />
                </div>
                <p className="capitalize">
                  Reply
                </p>
              </DropdownItem>
            </li>

            {/* Copy Button */}
            <li className="pt-2 border-gray-200">
              <DropdownItem
                onItemClick={closeDropdown}
                tag="button"
                onClick={() => handleCopy(message?.content)}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 hover:text-dashboard-royalblue-200 dark:text-gray-400 rounded-lg group text-theme-sm hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <div className="text-xl">
                  <RiFileCopyLine />
                </div>
                <p className="capitalize">
                  Copy
                </p>
              </DropdownItem>
            </li>

            {message?.sender === meUserId && (
              <>
                {/* Edit Button */}
                <li className="pt-2 border-gray-200">
                  <DropdownItem
                    onItemClick={closeDropdown}
                    tag="button"
                    onClick={handleEditOpen}
                    className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 hover:text-dashboard-royalblue-200 dark:text-gray-400 rounded-lg group text-theme-sm hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <div className="text-xl">
                      <RiEdit2Line />
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
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Message
            </h4>
          </div>
          <div className="rounded-lg mx-2 bg-[url(/123.png)] bg-size-[25%] bg-repeat py-6 flex items-center justify-center">
            <div className="max-w-xs flex flex-col p-2 space-y-2 rounded-lg bg-brand-700 text-white">
              <p className="mt-1">
                {message?.content}
              </p>
              <div>
                <small className="flex gap-2 justify-end text-xs text-end text-gray-200">
                  <TimeZone utcDateStr={message?.sent_at} />
                </small>
              </div>
            </div>
          </div>
          <form className="pt-4 flex flex-col">
            <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
              <div className="">
                <div className="grid gap-x-6 gap-y-5">
                  <div className="">
                    <Input
                      type="text"
                      placeholder="Type a message"
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                    />
                  </div>

                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-start">
              <Button
                size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button
                size="sm"
                type="submit"
                title="Send edited message"
                onClick={(e) => handleEdit(e)}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
});

export default MsgDropdown