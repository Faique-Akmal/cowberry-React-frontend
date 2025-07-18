import { FormEvent, useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import MultiSelect from "../form/MultiSelect";
import { axiosPostCreateGroup, AxiosAllGroup} from "../../store/chatStore"
import { axiosGetUsers } from "../../store/userStore";

interface Props {
  groups: AxiosAllGroup[];
  activeChatId: number;
  onSelectChat: (id: number) => void;
}

interface Option {
  value: number;
  text: string;
}

const ChatList: React.FC<Props> = ({ groups, activeChatId, onSelectChat }) => {
  const { isOpen, openModal, closeModal } = useModal();
  const [groupName, setGroupName] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [users, setUsers] = useState([]);
 
  const [userOptions, setUserOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (users.length > 0) {
      const transformed = users.map<Option>(user => ({
        value: user?.id,
        text: user?.username,
      }));
      setUserOptions(transformed);
    }

  }, [users]);

  const handleSave = (e:FormEvent) => {
     e.preventDefault();
    // Handle save logic here

    axiosPostCreateGroup({
            name: groupName.trim(),
            members: [...selectedValues] 
          });

    console.log("Saving changes...");
    setGroupName("");
    setSelectedValues([]);
    closeModal();
  };

  useEffect(() => {
    ;(async ()=>{
      const allUsers = await axiosGetUsers();

      if(allUsers?.length > 0){
        setUsers(allUsers);
      }
    }
    )();
  }, []);
  
  return (
    <>
    <div className="w-full bg-dashboard-brown-200 md:w-1/3 h-[80vh]">
      <div className="text-end h-1/12 m-2">
        <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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

      <div className="h-11/12 py-2 custom-scrollbar overflow-y-auto overflow-hidden">
        {
          groups.length <= 0 ?
          <div className="flex items-center justify-center">
            <p className="text-white">No Chat Group Found...</p> 
            {/* <Spinner text="Loading Chat Group..." /> */}
          </div>
          : <div className="">
          {groups.map((group) => (
          <div
          key={group?.group_id}
          onClick={() => onSelectChat(group?.group_id)}
          className={`flex gap-2 mx-2 my-1 rounded-xl p-4 cursor-pointer text-white hover:bg-green-500 ${activeChatId === group?.group_id ? "bg-brand-500": "bg-cowberry-cream-500"}`}
        >
          <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
            <img src="/images/user/owner.jpg" alt="User" />
          </span>
          <div>
            <h3 className="font-semibold">{group?.group_name}</h3>
            <p className="text-sm text-gray-300">
              {/* {chat.messages[chat.messages.length - 1]?.text} */}
            </p>
          </div>
        </div>
        ))}
        </div>

        }
        

        {/* <div className="">
          {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`bg-cowberry-cream-500 flex gap-2 mx-2 my-1 rounded-xl p-4 cursor-pointer text-white hover:bg-green-500 ${
              activeChatId === chat.id ? "bg-brand-500 " : ""
            }`}
          >
            <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
              <img src="/images/user/owner.jpg" alt="User" />
            </span>
            <div>
              <h3 className="font-semibold">{chat.name}</h3>
              <p className="text-sm text-dashboard-brown-200">
                {chat.messages[chat.messages.length - 1]?.text}
              </p>
            </div>
          </div>
        ))}
        </div> */}

      </div> 
      
      
    </div>
    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Create Chat Group
            </h4>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[400px] overflow-y-auto px-2 pb-3">
              <div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                  <div>
                    <Label>Group Name</Label>
                    <Input
                      type="text"
                      name="group_name"
                      placeholder="Enter new group name"
                      value={groupName}
                      onChange={(e)=> setGroupName(e.target.value)}
                    />
                  </div>

                  <div className="capitalize">
                    <MultiSelect
                      label="Multiple Select Options"
                      options={userOptions}
                      defaultSelected={[]}
                      onChange={(values) => setSelectedValues(values)}
                    />
                    <p className="sr-only">
                      Selected Values: {selectedValues.join(", ")}
                    </p>
                  </div>  
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}

export default ChatList
