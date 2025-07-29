import React, { useEffect, useState } from "react";
import axios from "axios";
import { role } from "../../store/store";
import API from "../../api/axios";

type User = {
  id: number;
  username: string;
  email: string;
  mobile_no: string | null;
  employee_code: string;
  role: number;
  profile_image: string | null;
  is_online: boolean;
};

type PaginationResponse = {
  results: User[];
  current_page: number;
  total_pages: number;
  total_count?: number; // optional
};

const UserPagination: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchUsers = async (page: number, username?: string) => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await API.get<PaginationResponse>(
        "/users/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            page,
            limit: 10,
            username: username || "",
            sort_by: "username",
            sort_order: sortOrder,
          },
        }
      );
      setUsers(res.data.results);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.total_pages);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }; 

  const getRoleName = (roleId: number): string => {
    const roleObj = role.find((r) => r.id === roleId);
    return roleObj ? roleObj.name : "Unknown";
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers(currentPage, searchTerm);
    }, 300);
    return () => clearTimeout(debounce);
  }, [currentPage, searchTerm, sortOrder]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="bg-[url('/old-paper-texture.jpg')] bg-cover">
      <h2 className="text-2xl font-bold mb-4 text-center ">Users List</h2>

      <div className="mb-4 flex justify-center">
        <input
          type="text"
          placeholder="Search by username"
          value={searchTerm}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-96"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto  rounded-lg bg-transparent">
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-4 text-left">ID</th>
                <th
                  className="py-2 px-4 text-left cursor-pointer"
                  onClick={toggleSortOrder}
                >
                  Username {sortOrder === "asc" ? "↑" : "↓"}
                </th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Mobile</th>
                <th className="py-2 px-4 text-left">Employee Code</th>
                <th className="py-2 px-4 text-left">Role</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="py-2 px-4">{user.id}</td>
                    <td className="py-2 px-4">{user.username}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">{user.mobile_no || "N/A"}</td>
                    <td className="py-2 px-4">{user.employee_code}</td>
                    <td className="py-2 px-4 uppercase">{getRoleName(user.role)}</td>
                    <td className="py-2 px-4">
                      {user.is_online ? (
                        <span className="text-green-600 font-medium">Online</span>
                      ) : (
                        <span className="text-red-500 font-medium">Offline</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center mt-6 gap-2 flex-wrap">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-2 rounded ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserPagination;
