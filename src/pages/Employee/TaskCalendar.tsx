import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";

const TaskCalendar = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await API.get("/my-assigned-tasks/");
    //   console.log("API Response:", response.data);

      const tasks = response.data.results;

      const formattedEvents = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        start: dayjs(task.date).format("YYYY-MM-DD"),
        extendedProps: {
          description: task.description,
          status: task.status,
          assigned_by: task.assigned_by,
        },
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedTask(clickInfo.event);
    setModalOpen(true);
  };

  return (
    <div className="p-4 ">
      <h2 className="text-xl font-semibold mb-4">My Task Calendar</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
      />

      {/* Task Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Task Details</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Title:</strong> {selectedTask.title}</p>
              <p><strong>Date:</strong> {selectedTask.startStr}</p>
              <p><strong>Status:</strong> {selectedTask.extendedProps?.status || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedTask.extendedProps?.description || 'No description'}</p>
              <p><strong>Assigned By:</strong> {selectedTask.extendedProps?.assigned_by || 'Unknown'}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setModalOpen(false);
                  navigate("/attandanceStart-page");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
              >
                Go to Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;
