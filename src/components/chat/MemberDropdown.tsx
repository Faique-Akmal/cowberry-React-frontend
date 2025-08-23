import { useMemo, useState, useCallback } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Members } from "../../store/chatStore";
import Avatar from "../ui/avatar/Avatar";
import Alert from "../ui/alert/Alert";
import { useSocketStore } from "../../store/socketStore";
import { IoIosInformationCircleOutline } from "react-icons/io";

interface Props {
  members: Members[];
}

const MemberDropdown: React.FC<Props> = ({ members }) => {
  const { onlineGroupUsers } = useSocketStore();
  const [isOpen, setIsOpen] = useState(false);
  const [allMembers, setAllMembers] = useState<Members[]>(members);
   console.log("all members", members);
  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }, []);

  return (
    <div>
      <button
        onClick={toggleDropdown}
        className="flex items-center bg-white p-2 px-4 rounded-full text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <div className="flex gap-1 items-center mr-2 font-medium text-nowrap text-theme-sm capitalize">
          <IoIosInformationCircleOutline className="text-xl" /> Group info
          {/* (<strong className="text-brand-500">{allMembers.length}</strong>)  */}
        </div>
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
        isOpen={isOpen}
        onClose={closeDropdown}
        className="-translate-x-4 absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <h3 className="ml-4 text-gray-500">
          {allMembers.length} members
        </h3>
        <ul className="custom-scrollbar overflow-y-auto overflow-hidden h-58 flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          {allMembers.length === 0 ? (
            <li>
              <DropdownItem
                tag="button"
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                <Alert
                  variant="warning"
                  title="Members Not Found!"
                  message="Try again later!"
                  showLink={false}
                />
              </DropdownItem>
            </li>
          ) : (
            allMembers.map((member) => (
              <li key={member.id}>
                <DropdownItem
                  tag="button"
                  className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  <div className="flex gap-2 justify-center items-center">
                    <Avatar
                      src="/images/user/user-01.jpg"
                      size="large"
                      status={member.is_online ? "online" : "offline"}
                    />
                    <p className="capitalize">{member.username}</p>
                  </div>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
};

export default MemberDropdown;
