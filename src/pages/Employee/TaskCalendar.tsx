import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { role } from "../../store/store";
import { useTranslation } from "react-i18next";

// Define proper TypeScript interfaces
interface Task {
  id: number;
  title: string;
  date: string;
  dest_lat?: number;
  dest_lng?: number;
  address: string;
  description: string;
  status: string;
  assigned_by: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  extendedProps: {
    description: string;
    dest_lat?: number;
    dest_lng?: number;
      address: string;
       status: string;
    assigned_by: string;
  };
}

const TaskCalendar = () => {
  const {t} = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/my-assigned-tasks/");
      
      // console.log("API Response:", response.data.results);

      // Handle different API response structures
      const tasks: Task[] = response.data.results || response.data || [];

      if (!Array.isArray(tasks)) {
        throw new Error("API response is not an array");
      }

      const formattedEvents: CalendarEvent[] = tasks.map((task: Task) => ({
        id: task.id,
        title: task.title || "Untitled Task",
        start: dayjs(task.date).format("YYYY-MM-DD"),
        extendedProps: {
          dest_lat: task.dest_lat || 0,
          dest_lng: task.dest_lng || 0,
          address: task.address || "No address provided",
          description: task.description || "",
          status: task.status || "pending",
          assigned_by: task.assigned_by || "Unknown",
        },
      }));

      setEvents(formattedEvents);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setError(error.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

   const getRoleName = (roleId: number): string => {
      const roleObj = role.find((r) => r.id === roleId);
      return roleObj ? roleObj.name : "Unknown";
    };

  const handleEventClick = (clickInfo: any) => {
    setSelectedTask(clickInfo.event);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };
  const handleGoToTask = () => {
    closeModal(); 
    navigate("/task-show-page");
  } 
  // const handleGoToAttendance = () => {
  //   closeModal();
  // window.open(`https://www.google.com/maps?q=${task.dest_lat},${task.dest_lng}`, "_blank")
  // };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[400px]">
        <div className="text-lg">{t("calendar.Loading tasks...")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-white border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>{t("calendar.Error")}:</strong> {error}
          <button
            onClick={fetchTasks}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {t("calendar.Retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md dark:bg-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t("calendar.Task Calendar")}</h2>
        <button
          onClick={fetchTasks}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {t("Refresh")}
        </button>
      </div>
      
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek"
        }}
        eventDisplay="block"
        dayMaxEvents={4}
        moreLinkClick="popover"
      />

      {/* Task Modal */}
      {isModalOpen && selectedTask && (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center"
          onClick={closeModal}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t("caledar.Task Details")}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">{t("task.Title")}:</span>
                <span className="ml-2 text-gray-900">{selectedTask.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("task.Date")}:</span>
                <span className="ml-2 text-gray-900">
                  {dayjs(selectedTask.startStr).format("MMMM D, YYYY")}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("attendence.Status")}:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTask.extendedProps?.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : selectedTask.extendedProps?.status === 'in-progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedTask.extendedProps?.status || 'pending'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("task.Description")}:</span>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedTask.extendedProps?.description || 'No description available'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("task.Assigned By")}:</span>
                <span className="ml-2 text-gray-900">
                  {getRoleName(selectedTask.extendedProps?.assigned_by || 'Unknown')}
                  {/* {selectedTask.extendedProps?.assigned_by || 'Unknown'} */}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t("task.Destination")}:</span>
                <span className="ml-2 text-gray-900"> {selectedTask.extendedProps?.address || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                {t("calendar.Close")}
              </button>
              <button
  //               onClick={() =>
  //   window.open(`https://www.google.com/maps?q=${selectedTask.extendedProps?.dest_lat},${selectedTask.extendedProps?.dest_lng}`, "_blank")
  // }
                onClick={handleGoToTask}

                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
               {t("calendar.Show Tasks")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;