import { useEffect } from "react";
// import axios from "axios";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import { role } from "../../store/store";
import Alert from "../ui/alert/Alert";
// import API from "../../api/axios";

// interface UserProfile {
//   username: string;
//   role: string;
//   address: string;
//   profile_image: string;
// }

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();

  const localMeData = localStorage.getItem("meUser")!
  const meUserData = JSON.parse(localMeData)!

// const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(false);


  useEffect(() => {
    // const fetchUser = async () => {
    //   try {
    //     // const accessToken = localStorage.getItem("accessToken"); // Adjust key if needed
    //     const response = await API.get<UserProfile>(
    //       "/me/",
        
    //     );
    //     
    //   } catch (err) {
    //     console.error("Failed to load meUserData data:", err);
    //     setError(true);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // const localMeData = localStorage.getItem("meUser");
      
    //     if(localMeData){
    //       setUser(JSON.parse(localMeData));
    //     }

    // fetchUser();
  }, []);

  const getRoleName = (roleId: number): string => {
      const roleObj = role.find((r) => r.id === roleId);
      return roleObj ? roleObj.name : "Unknown";
    };

  // if (loading) return <p className="text-center">Loading profile...</p>;
  if (!meUserData)
    return (
       <Alert
        variant="warning"
        title="Failed to load meUserData profile!"
        message="Please try again later."
        showLink={false}
      />
    );

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-22 h-22 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={meUserData?.profile_image || "/cowberry_logo_with_bg.jpg"}
                alt="user"
                className="bg-cover w-full h-full "
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left capitalize">
                {meUserData?.username}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">{getRoleName(meUserData?.role)}</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{meUserData?.address}</p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {/* You can add social icons or buttons here if needed */}
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="text-center p-4">
          <p>Editing is currently disabled in this demo.</p>
        </div>
      </Modal>
    </>
  );
}
