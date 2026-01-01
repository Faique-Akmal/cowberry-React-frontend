import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
// import { Link } from "react-router";
import AnnouncementModal from "./AnnouncementModal";
import axios from 'axios';
import API from "../../api/axios";

// Define the announcement type based on your API response
interface Announcement {
  id: number;
  title: string;
  description: string;
  content: string;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Announcement[];
}

// Create axios instance (you might want to move this to a separate file)


// Add request interceptor to include token


export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch announcements from API
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Using Axios to fetch announcements
      const response = await API.get<ApiResponse>('/auth/announcements');
      const data = response.data;
      
      if (data.success && data.data) {
        setAnnouncements(Array.isArray(data.data) ? data.data : [data.data]);
        // Check if there are any active announcements to show notification dot
        const hasActiveAnnouncements = Array.isArray(data.data) 
          ? data.data.some(ann => ann.isActive)
          : data.data.isActive;
        setNotifying(hasActiveAnnouncements);
      } else {
        setError(data.message || "Failed to fetch announcements");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Axios-specific error handling
        if (err.response) {
          // Server responded with an error status
          setError(err.response.data?.message || `Error: ${err.response.status}`);
        } else if (err.request) {
          // Request was made but no response received
          setError("No response from server. Please check your connection.");
        } else {
          // Something happened in setting up the request
          setError(err.message);
        }
      } else {
        // Non-Axios error
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      
      // For demo purposes, set some mock data
      setAnnouncements();
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo purposes
 

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
    closeDropdown();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  // Function to get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'maintenance':
        return '🛠️';
      case 'update':
        return '🔄';
      case 'general':
        return '📢';
      default:
        return '📄';
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors dark:bg-cowberry-green-600 bg-amber-300 border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="fixed left-1/2 transform -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 flex flex-col gap-3 w-[90%] sm:w-auto max-w-sm z-50 p-6"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Announcements
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        
        <ul className="flex flex-col h-auto max-h-96 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button 
                onClick={fetchAnnouncements}
                className="mt-2 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No announcements found
            </div>
          ) : (
            announcements.map((announcement) => (
              <li key={announcement.id}>
                <DropdownItem
                  onItemClick={() => handleAnnouncementClick(announcement)}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 cursor-pointer"
                >
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800">
                    <span className="text-lg">{getCategoryIcon(announcement.category)}</span>
                    <span className={`absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white ${getPriorityColor(announcement.priority)} dark:border-gray-900`}></span>
                  </span>

                  <span className="block flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-white/90 line-clamp-1">
                        {announcement.title}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(announcement.priority)} text-white`}>
                        {announcement.priority}
                      </span>
                    </div>
                    
                    <span className="mb-1.5 block text-theme-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {announcement.description}
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {announcement.createdBy.username}
                      </span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatDate(announcement.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
        
        {/* <Link
          to="/announcements"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          onClick={closeDropdown}
        >
          View All Announcements
        </Link> */}
      </Dropdown>

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        announcement={selectedAnnouncement}
      />
    </div>
  );
}