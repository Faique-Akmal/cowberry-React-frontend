import { useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
// import Avatar from "../ui/avatar/Avatar";
// import Alert from "../ui/alert/Alert";
import { RiDeleteBin6Line } from "react-icons/ri";
import { axiosDeleteMsg } from "../../store/chatStore";
import toast from "react-hot-toast";

interface Props{
  msgId: number;
  msgSender: number;
  meUserId: number;
  onMsgDelete:() => void;
}

const MemberDropdown:React.FC<Props> = ({msgId, msgSender, meUserId, onMsgDelete}) => {
  const [isOpen, setIsOpen] = useState(false);

  // console.log(msgId);
  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function deleteMsg (msgId:number) {
    try {
      const deleteRes = await axiosDeleteMsg(msgId)!;
  
      if(deleteRes){
        onMsgDelete();
        console.log(deleteRes);
        toast.success("Message deleted successfuly.")
      }

    } catch (error) {
        console.error("Message delete request error:", error);
        toast.error("Message delete error!")
    }
  }

  function handleDelete (){
    if(meUserId === msgSender){
      deleteMsg(msgId);
    } else {
      toast.error("This is not your chat!",{
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
    }
  }

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
          {/* Delete Button */}
          <li className="pt-2 border-t border-gray-200">
            <DropdownItem
              onItemClick={closeDropdown}
              tag="button"
              onClick={handleDelete}
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 hover:text-delete dark:text-gray-400 rounded-lg group text-theme-sm hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <div>
                <RiDeleteBin6Line />
              </div>
              <p className="capitalize">
                Delete
              </p>
            </DropdownItem>
          </li>

        </ul>
      </Dropdown>
    </div>
  )
}

export default MemberDropdown