import { useEffect, useState } from "react";

// import axios from "axios";
import { role , department } from "../../store/store";
import { AxiosGetMe } from "../../store/userStore";
import Alert from "../ui/alert/Alert";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";


type Address = {
  country: string;
  city_state: string;
  postal_code: string;
  tax_id: string;
};


export default function UserInfoCard() {
  const [user, setUser] = useState<AxiosGetMe| null>(null);
  const [userRole, setRole] = useState<string>("");
  const [userDepartment, setDepartment] = useState<string>("");
  const [address, setAddress] = useState<Address>({
      country: "",
      city_state: "",
      postal_code: "",
      tax_id: "",
    });
  
   const { isOpen, openModal, closeModal } = useModal();

  // const [user, setUser] = useState({
  //   id: '',
  //   username: '',
  //   first_name: '',
  //   last_name: '',
  //   email: '',
  //   role: '',
  //   department: '',
  //   mobile_no: '',
  //   birth_date: '',
  //   address: '',
  //   profile_image: ''
  // });

  const localMeData = localStorage.getItem("meUser")!
  const meUserData = JSON.parse(localMeData)!

  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');

  // Create a persistent Axios instance

  // const axiosInstance = axios.create({
  //   baseURL: "http://192.168.0.144:8000/api",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });
     
   const getRoleName = (roleId: number) => {
      const roleObj = role.find((r) => r.id === roleId);
      const roleName = roleObj ? roleObj.name : "Unknown";
      if(user){
        setRole(roleName);
      }
    };
    
  const getDepartmentName = (departmentId: number) => {
      const departmentObj = department.find((d) => d.id === departmentId);
      const departmentName = departmentObj ? departmentObj.name : "Unknown";

      if(user){
        setDepartment(departmentName);
      }
    };
  // Add request interceptor (runs once)
  // axiosInstance.interceptors.request.use((config) => {
  //   const accessToken = localStorage.getItem("accessToken");
  //   if (accessToken) {
  //     config.headers.Authorization = `Bearer ${accessToken}`;
  //   }
  //   return config;
  // });

  

  // Add response interceptor for token refreshing
  // axiosInstance.interceptors.response.use(
  //   (response) => response,
  //   async (error) => {
  //     const originalRequest = error.config;


  //     if (error.response?.status === 401 && !originalRequest._retry) {
  //       originalRequest._retry = true;

  //       try {
  //         const refreshToken = localStorage.getItem("refreshToken");
  //         if (!refreshToken) throw new Error("No refresh token");



  //         const newAccessToken = res.data.access;
  //         localStorage.setItem("accessToken", newAccessToken);

  //         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
  //         return axiosInstance(originalRequest); // Retry original request
  //       } catch (err) {
  //         console.error("Refresh token failed", err);
  //         localStorage.removeItem("accessToken");
  //         localStorage.removeItem("refreshToken");
  //         setError("Session expired. Please log in again.");
  //       }
  //     }

  //     return Promise.reject(error);
  //   }
  // );
  //   }

  useEffect(() => {
    // const fetchUser = async () => {
    //   try {
    //     setLoading(true);

    //     const response = await axiosInstance.get(`/me/`);
    //  localStorage.setItem("meuser" , JSON.stringify(response.data)); 


      // } catch (err) {
      //   console.error(err);
      //   setError("Failed to fetch user details.");
      // } finally {
      //   setLoading(false);
      // }
    // };

    // fetchUser();
    setUser(meUserData);

    
  }, []);

  useEffect(()=>{
    if(user){
      getRoleName(user?.role);
      getDepartmentName(user?.department);
    }
  },[user])
  
  const handleSave = () => {
    // You can send updated address back to API here
    console.log("Saving changes...", address);
    closeModal();
  };


  // console.log(user)

  if (!meUserData) return (
     <Alert
      variant="warning"
      title="Failed to load user data profile.!"
      message="Please try again later."
      showLink={false}
    />
  )
  // if (loading) return <div className="p-4">Loading...</div>;
  // if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-3 border bg-white border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">

      {/* user profile */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
              {user?.first_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                {user?.last_name|| "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {user?.email || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.mobile_no || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Role
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
             {userRole}
              </p>
            </div>
             <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Department
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
             {userDepartment}
              </p>
            </div>
               <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
             {user?.address || "N/A"}
              </p>
            </div>
          </div>
        </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              />
            </svg>
            Edit
          </button>

          </div>
   </div>

   
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Address
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Country</Label>
                  <Input
                    type="text"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  />
                </div>

                <div>
                  <Label>City/State</Label>
                  <Input
                    type="text"
                    value={address.city_state}
                    onChange={(e) => setAddress({ ...address, city_state: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Postal Code</Label>
                  <Input
                    type="text"
                    value={address.postal_code}
                    onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Area/Street</Label>
                  <Input
                    type="text"
                    value={address.tax_id}
                    onChange={(e) => setAddress({ ...address, tax_id: e.target.value })}
                  />
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
   </div>

  );
}
