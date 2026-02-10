import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaUserPlus,
  FaBuilding,
  FaUserTag,
  FaSpinner,
  FaMapMarkerAlt,
  FaSearch,
  FaEnvelope,
  FaIdBadge,
  FaBriefcase,
  FaCalendarAlt,
  FaUsers,
} from "react-icons/fa";
import PageMeta from "../../components/common/PageMeta";
import LoadingAnimation from "../UiElements/loadingAnimation";

interface Department {
  departmentId: number;
  name: string;
}

interface Role {
  id?: number;
  roleId?: number;
  name: string;
  roleName?: string;
}

interface Zone {
  zoneId: string;
  id?: number;
  name: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  description?: string;
}

interface Employee {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string;
  designation?: string | null;
  mobileNo: string;
  role: string;
  department: string | { name: string };
  zone?: {
    id: number;
    zoneId: string;
    name: string;
    area: string;
    city: string;
  } | null;
}

export default function RegisterUserForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    full_name: "",
    email: "",
    password: "",
    role: "",
    mobileNo: "",
    designation: "",
    joiningDate: "",
    employmentType: "Permanent",
    reporteeId: "",
    hrManagerId: "",
    departmentId: "",
    address: "",
    allocatedArea: "",
    zoneId: "",
    birthDate: "",
    profileImageUrl: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [reportees, setReportees] = useState<Employee[]>([]);
  const [hrManagers, setHrManagers] = useState<Employee[]>([]);
  const [filteredReportees, setFilteredReportees] = useState<Employee[]>([]);
  const [filteredHrManagers, setFilteredHrManagers] = useState<Employee[]>([]);
  const [zoneSearch, setZoneSearch] = useState("");
  const [reporteeSearch, setReporteeSearch] = useState("");
  const [hrManagerSearch, setHrManagerSearch] = useState("");
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showReporteeDropdown, setShowReporteeDropdown] = useState(false);
  const [showHrManagerDropdown, setShowHrManagerDropdown] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingReportees, setIsLoadingReportees] = useState(false);
  const [isLoadingHrManagers, setIsLoadingHrManagers] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedReportee, setSelectedReportee] = useState<Employee | null>(
    null,
  );
  const [selectedHrManager, setSelectedHrManager] = useState<Employee | null>(
    null,
  );

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("meUser");
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const userDepartmentId = currentUser?.departmentId;

  // Employment type options
  const employmentTypes = [
    "Permanent",
    "Contractual",
    "Temporary",
    "Intern",
    "Freelance",
    "Probation",
  ];

  // Fetch departments, roles, zones, reportees, and HR managers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);

        // Fetch departments
        const deptResponse = await API.get("/departments/static_departments");
        let departmentsData: Department[] = [];

        if (Array.isArray(deptResponse.data)) {
          departmentsData = deptResponse.data;
        } else if (
          deptResponse.data?.departments &&
          Array.isArray(deptResponse.data.departments)
        ) {
          departmentsData = deptResponse.data.departments;
        } else if (
          deptResponse.data?.data &&
          Array.isArray(deptResponse.data.data)
        ) {
          departmentsData = deptResponse.data.data;
        }

        const validDepartments = departmentsData
          .filter(
            (dept: any) => dept && (dept.departmentId || dept.id) && dept.name,
          )
          .map((dept: any) => ({
            departmentId: dept.departmentId || dept.id,
            name: dept.name,
          }));

        setDepartments(validDepartments);

        // Fetch roles
        const roleResponse = await API.get("/roles/static_roles");
        let rolesData: Role[] = [];

        if (Array.isArray(roleResponse.data)) {
          rolesData = roleResponse.data;
        } else if (
          roleResponse.data?.roles &&
          Array.isArray(roleResponse.data.roles)
        ) {
          rolesData = roleResponse.data.roles;
        } else if (
          roleResponse.data?.data &&
          Array.isArray(roleResponse.data.data)
        ) {
          rolesData = roleResponse.data.data;
        }

        const validRoles = rolesData
          .filter((role: any) => role && (role.name || role.roleName))
          .map((role: any) => ({
            id: role.id || role.roleId,
            name: role.name || role.roleName,
          }));

        setRoles(validRoles);

        // Fetch zones
        await fetchZones();

        // Fetch reportees and HR managers
        await fetchReportees();
        await fetchHrManagers();
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 404) {
          toast.error(
            "API endpoints not found. Please check your API configuration.",
          );
        } else if (error.response?.status === 401) {
          toast.error("Unauthorized. Please login again.");
        } else if (error.message === "Network Error") {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error("Failed to load data");
        }
        setDepartments([]);
        setRoles([]);
        setZones([]);
        setReportees([]);
        setHrManagers([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Function to fetch zones
  const fetchZones = async () => {
    try {
      setIsLoadingZones(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Authentication required to fetch zones");
        return;
      }

      const response = await API.get("/auth/zones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let zonesData: Zone[] = [];

      if (Array.isArray(response.data)) {
        zonesData = response.data;
      } else if (response.data?.zones && Array.isArray(response.data.zones)) {
        zonesData = response.data.zones;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        zonesData = response.data.data;
      }

      const validZones = zonesData
        .filter((zone: any) => zone && (zone.zoneId || zone.id) && zone.name)
        .map((zone: any) => ({
          zoneId: zone.zoneId || zone.id,
          id: zone.id || zone.zoneId,
          name: zone.name,
          area: zone.area,
          city: zone.city,
          state: zone.state,
          pincode: zone.pincode,
          description: zone.description,
        }));

      setZones(validZones);
      setFilteredZones(validZones);
    } catch (error: any) {
      console.error("Error fetching zones:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Authentication required to access zones");
      } else if (error.response?.status === 404) {
        toast.error("Zones endpoint not found");
      } else {
        toast.error("Failed to load zones");
      }
      setZones([]);
      setFilteredZones([]);
    } finally {
      setIsLoadingZones(false);
    }
  };

  // Function to fetch reportees
  const fetchReportees = async () => {
    try {
      setIsLoadingReportees(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Authentication required to fetch reportees");
        return;
      }

      const response = await API.get("/leaves/dropdown/reportees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let reporteesData: Employee[] = [];

      if (response.data?.success && Array.isArray(response.data.data)) {
        reporteesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        reporteesData = response.data;
      }

      const validReportees = reporteesData
        .filter((emp: any) => emp && emp.id && emp.email && emp.fullName)
        .map((emp: any) => ({
          id: emp.id,
          fullName: emp.fullName,
          email: emp.email,
          employeeCode: emp.employeeCode,
          designation: emp.designation,
          mobileNo: emp.mobileNo,
          role: emp.role,
          department:
            typeof emp.department === "string"
              ? emp.department
              : emp.department?.name || "",
          zone: emp.zone,
        }));

      setReportees(validReportees);
      setFilteredReportees(validReportees);
    } catch (error: any) {
      console.error("Error fetching reportees:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Authentication required to access reportees");
      } else if (error.response?.status === 404) {
        toast.error("Reportees endpoint not found");
      } else {
        toast.error("Failed to load reportees");
      }
      setReportees([]);
      setFilteredReportees([]);
    } finally {
      setIsLoadingReportees(false);
    }
  };

  // Function to fetch HR managers
  const fetchHrManagers = async () => {
    try {
      setIsLoadingHrManagers(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Authentication required to fetch HR managers");
        return;
      }

      const response = await API.get("/leaves/dropdown/hr-managers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let hrManagersData: Employee[] = [];

      if (response.data?.success && Array.isArray(response.data.data)) {
        hrManagersData = response.data.data;
      } else if (Array.isArray(response.data)) {
        hrManagersData = response.data;
      }

      const validHrManagers = hrManagersData
        .filter((emp: any) => emp && emp.id && emp.email && emp.fullName)
        .map((emp: any) => ({
          id: emp.id,
          fullName: emp.fullName,
          email: emp.email,
          employeeCode: emp.employeeCode,
          designation: emp.designation,
          mobileNo: emp.mobileNo,
          role: emp.role || "HR Manager", // Default role for HR managers
          department:
            typeof emp.department === "string"
              ? emp.department
              : emp.department?.name || "",
          zone: emp.zone,
        }));

      setHrManagers(validHrManagers);
      setFilteredHrManagers(validHrManagers);
    } catch (error: any) {
      console.error("Error fetching HR managers:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Authentication required to access HR managers");
      } else if (error.response?.status === 404) {
        toast.error("HR managers endpoint not found");
      } else {
        toast.error("Failed to load HR managers");
      }
      setHrManagers([]);
      setFilteredHrManagers([]);
    } finally {
      setIsLoadingHrManagers(false);
    }
  };

  // Filter zones based on search input
  useEffect(() => {
    if (zoneSearch.trim() === "") {
      setFilteredZones(zones);
    } else {
      const filtered = zones.filter(
        (zone) =>
          zone.name.toLowerCase().includes(zoneSearch.toLowerCase()) ||
          (zone.area &&
            zone.area.toLowerCase().includes(zoneSearch.toLowerCase())) ||
          (zone.city &&
            zone.city.toLowerCase().includes(zoneSearch.toLowerCase())) ||
          (zone.zoneId &&
            zone.zoneId.toLowerCase().includes(zoneSearch.toLowerCase())),
      );
      setFilteredZones(filtered);
    }
  }, [zoneSearch, zones]);

  // Filter reportees based on search input
  useEffect(() => {
    if (reporteeSearch.trim() === "") {
      setFilteredReportees(reportees);
    } else {
      const filtered = reportees.filter(
        (emp) =>
          emp.email.toLowerCase().includes(reporteeSearch.toLowerCase()) ||
          emp.fullName.toLowerCase().includes(reporteeSearch.toLowerCase()) ||
          emp.employeeCode.toLowerCase().includes(reporteeSearch.toLowerCase()),
      );
      setFilteredReportees(filtered);
    }
  }, [reporteeSearch, reportees]);

  // Filter HR managers based on search input
  useEffect(() => {
    if (hrManagerSearch.trim() === "") {
      setFilteredHrManagers(hrManagers);
    } else {
      const filtered = hrManagers.filter(
        (emp) =>
          emp.email.toLowerCase().includes(hrManagerSearch.toLowerCase()) ||
          emp.fullName.toLowerCase().includes(hrManagerSearch.toLowerCase()) ||
          emp.employeeCode
            .toLowerCase()
            .includes(hrManagerSearch.toLowerCase()),
      );
      setFilteredHrManagers(filtered);
    }
  }, [hrManagerSearch, hrManagers]);

  // Handler for input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for zone selection
  const handleZoneSelect = (zone: Zone) => {
    setFormData((prev) => ({
      ...prev,
      zoneId: zone.zoneId,
    }));
    setSelectedZone(zone);
    setZoneSearch(zone.name);
    setShowZoneDropdown(false);
  };

  // Handler for reportee selection

  const handleReporteeSelect = (employee: Employee) => {
    const newFormData = {
      ...formData,
      reporteeId: employee.id.toString(),
    };

    setFormData(newFormData);
    setSelectedReportee(employee);
    setReporteeSearch(`${employee.email} (${employee.employeeCode})`);
    setShowReporteeDropdown(false);
  };

  // Update the handler for HR manager selection
  const handleHrManagerSelect = (employee: Employee) => {
    const newFormData = {
      ...formData,
      hrManagerId: employee.id.toString(),
    };

    setFormData(newFormData);
    setSelectedHrManager(employee);
    setHrManagerSearch(`${employee.email} (${employee.employeeCode})`);
    setShowHrManagerDropdown(false);
  };

  // Handler for zone search input change
  const handleZoneSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZoneSearch(value);

    if (value !== selectedZone?.name) {
      setSelectedZone(null);
      setFormData((prev) => ({
        ...prev,
        zoneId: "",
      }));
    }

    if (!showZoneDropdown && value.trim() !== "") {
      setShowZoneDropdown(true);
    }
  };

  // Handler for reportee search input change
  const handleReporteeSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setReporteeSearch(value);

    if (
      value !== `${selectedReportee?.email} (${selectedReportee?.employeeCode})`
    ) {
      setSelectedReportee(null);
      setFormData((prev) => ({
        ...prev,
        reporteeId: "",
      }));
    }

    if (!showReporteeDropdown && value.trim() !== "") {
      setShowReporteeDropdown(true);
    }
  };

  // Handler for HR manager search input change
  const handleHrManagerSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setHrManagerSearch(value);

    if (
      value !==
      `${selectedHrManager?.email} (${selectedHrManager?.employeeCode})`
    ) {
      setSelectedHrManager(null);
      setFormData((prev) => ({
        ...prev,
        hrManagerId: "",
      }));
    }

    if (!showHrManagerDropdown && value.trim() !== "") {
      setShowHrManagerDropdown(true);
    }
  };

  // Clear zone selection
  const clearZoneSelection = () => {
    setFormData((prev) => ({
      ...prev,
      zoneId: "",
    }));
    setSelectedZone(null);
    setZoneSearch("");
    setShowZoneDropdown(false);
  };

  // Clear reportee selection
  const clearReporteeSelection = () => {
    setFormData((prev) => ({
      ...prev,
      reporteeId: "",
    }));
    setSelectedReportee(null);
    setReporteeSearch("");
    setShowReporteeDropdown(false);
  };

  // Clear HR manager selection
  const clearHrManagerSelection = () => {
    setFormData((prev) => ({
      ...prev,
      hrManagerId: "",
    }));
    setSelectedHrManager(null);
    setHrManagerSearch("");
    setShowHrManagerDropdown(false);
  };

  // Handler for form submission

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setIsLoading(true);

    // Debug: Log the form data before submission

    // Basic validation
    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.full_name.trim()
    ) {
      toast.error("Username, Full Name, Email and Password are required.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (
      formData.mobileNo &&
      !/^\d{10}$/.test(formData.mobileNo.replace(/\D/g, ""))
    ) {
      toast.error("Please enter a valid 10-digit mobile number.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!formData.departmentId) {
      toast.error("Please select a department.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!formData.role) {
      toast.error("Please select a role.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Prepare payload according to new API requirements
      const payload = {
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        mobileNo: formData.mobileNo || null,
        designation: formData.designation || null,
        joiningDate: formData.joiningDate || null,
        employmentType: formData.employmentType,
        reporteeId: formData.reporteeId ? parseInt(formData.reporteeId) : null,
        hrManagerId: formData.hrManagerId
          ? parseInt(formData.hrManagerId)
          : null,
        departmentId: parseInt(formData.departmentId),
        address: formData.address || null,
        allocatedArea: formData.allocatedArea || null,
        zoneId: formData.zoneId || null,
        birthDate: formData.birthDate || null,
        profileImageUrl: formData.profileImageUrl || null,
      };

      // Debug: Log the payload before sending

      const response = await API.post("/auth/register", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        const responseData = response.data;
        toast.success(responseData.message || "Registration successful!");
        setMessage(responseData.message || "User registered successfully!");
        setIsError(false);

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          username: "",
          full_name: "",
          email: "",
          password: "",
          role: "",
          mobileNo: "",
          designation: "",
          joiningDate: "",
          employmentType: "Permanent",
          reporteeId: "",
          hrManagerId: "",
          departmentId: "",
          address: "",
          allocatedArea: "",
          zoneId: "",
          birthDate: "",
          profileImageUrl: "",
        });
        setSelectedZone(null);
        setSelectedReportee(null);
        setSelectedHrManager(null);
        setZoneSearch("");
        setReporteeSearch("");
        setHrManagerSearch("");
        setShowUrlInput(false);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64 mt-14">
        <div className="text-center">
          <LoadingAnimation />
          <p className="text-gray-600 dark:text-gray-300">
            Loading Registration Form........
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 border-2xl-rounded shadow-lg backdrop-blur-2xl">
      <PageMeta
        title="Employee Registration"
        description="Register a new employee"
      />

      {/* Header */}
      <div className="text-center mb-10 border-2xl white bg-blur">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 dark:text-gray-200">
          User Registration
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <FaUserPlus className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Personal Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Username *
              </label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Account Information Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Account Information
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
        </div>

        {/* Role & Department Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Role & Department
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
                  <FaUserTag className="text-blue-600 dark:text-blue-400" />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Role *
                </label>
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={roles.length === 0}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
                <option value="">Choose a role</option>
                {roles.length > 0 ? (
                  roles.map((role, index) => (
                    <option key={role.id || index} value={role.name}>
                      {role.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No roles available
                  </option>
                )}
              </select>
              {roles.length === 0 && (
                <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-400">
                  No roles found. Please check API connection.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
                  <FaBuilding className="text-blue-600 dark:text-blue-400" />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Department *
                </label>
              </div>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                disabled={departments.length === 0}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
                <option value="">Choose a department</option>
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No departments available
                  </option>
                )}
              </select>
              {departments.length === 0 && (
                <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-400">
                  No departments found. Please check API connection.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Employment Information Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Employment Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
                  <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Designation
                </label>
              </div>
              <input
                type="text"
                name="designation"
                placeholder="Enter designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
                  <FaCalendarAlt className="text-blue-600 dark:text-blue-400" />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Joining Date
                </label>
              </div>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
                  <FaBriefcase className="text-blue-600 dark:text-blue-400" />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employment Type
                </label>
              </div>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Additional Information
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobileNo"
                  placeholder="10-digit mobile number"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Allocated Area
              </label>
              <input
                type="text"
                name="allocatedArea"
                placeholder="Enter allocated area"
                value={formData.allocatedArea}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Zone Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Zone
                </label>
                {isLoadingZones && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <FaSpinner className="animate-spin" />
                    Loading zones...
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for a zone by name or zone ID..."
                      value={zoneSearch}
                      onChange={handleZoneSearchChange}
                      onFocus={() => setShowZoneDropdown(true)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    {zoneSearch && (
                      <button
                        type="button"
                        onClick={clearZoneSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Clear selection"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchZones()}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                    title="Refresh zones"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>

                {/* Hidden input to store zone ID */}
                <input type="hidden" name="zoneId" value={formData.zoneId} />

                {/* Zone Dropdown */}
                {showZoneDropdown && filteredZones.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredZones.map((zone) => (
                      <div
                        key={zone.zoneId}
                        onClick={() => handleZoneSelect(zone)}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {zone.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Zone ID: {zone.zoneId}
                              {zone.area && <span> • {zone.area}</span>}
                              {zone.city && <span> • {zone.city}</span>}
                            </div>
                            {zone.state && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {zone.state}{" "}
                                {zone.pincode && `• ${zone.pincode}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No zones found message */}
                {showZoneDropdown &&
                  zoneSearch &&
                  filteredZones.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        No zones found matching "{zoneSearch}"
                      </div>
                    </div>
                  )}
              </div>

              {selectedZone && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <FaMapMarkerAlt />
                  <span>
                    Selected: {selectedZone.name} (Zone ID:{" "}
                    {selectedZone.zoneId})
                  </span>
                </div>
              )}

              <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                Search and select a zone to allocate to this user
              </p>
            </div>
          </div>
        </div>

        {/* Reporting Structure Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Reporting Structure
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reportee Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reportee
                </label>
                {isLoadingReportees && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <FaSpinner className="animate-spin" />
                    Loading reportees...
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for reportee by email or name..."
                      value={reporteeSearch}
                      onChange={handleReporteeSearchChange}
                      onFocus={() => setShowReporteeDropdown(true)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    {reporteeSearch && (
                      <button
                        type="button"
                        onClick={clearReporteeSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Clear selection"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchReportees()}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                    title="Refresh reportees"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>

                {/* Hidden input to store reportee ID */}
                <input
                  type="hidden"
                  name="reporteeId"
                  value={formData.reporteeId}
                />

                {/* Reportee Dropdown */}
                {showReporteeDropdown && filteredReportees.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredReportees.map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleReporteeSelect(employee)}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <FaEnvelope className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {employee.fullName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {employee.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <FaIdBadge className="w-3 h-3" />
                                {employee.employeeCode}
                              </span>
                              <span>•</span>
                              <span>{employee.department}</span>
                              {employee.role && (
                                <>
                                  <span>•</span>
                                  <span>{employee.role}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No reportees found message */}
                {showReporteeDropdown &&
                  reporteeSearch &&
                  filteredReportees.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        No reportees found matching "{reporteeSearch}"
                      </div>
                    </div>
                  )}
              </div>

              {selectedReportee && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <FaUsers />
                  <span>
                    Selected: {selectedReportee.fullName} (
                    {selectedReportee.email}) - ID: {selectedReportee.id}
                  </span>
                </div>
              )}

              <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                Search and select a reportee for the user
              </p>
            </div>

            {/* HR Manager Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  HR Manager
                </label>
                {isLoadingHrManagers && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <FaSpinner className="animate-spin" />
                    Loading HR managers...
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for HR manager by email or name..."
                      value={hrManagerSearch}
                      onChange={handleHrManagerSearchChange}
                      onFocus={() => setShowHrManagerDropdown(true)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    {hrManagerSearch && (
                      <button
                        type="button"
                        onClick={clearHrManagerSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Clear selection"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchHrManagers()}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                    title="Refresh HR managers"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>

                {/* Hidden input to store HR manager ID */}
                <input
                  type="hidden"
                  name="hrManagerId"
                  value={formData.hrManagerId}
                />

                {/* HR Manager Dropdown */}
                {showHrManagerDropdown && filteredHrManagers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredHrManagers.map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleHrManagerSelect(employee)}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <FaUsers className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {employee.fullName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {employee.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <FaIdBadge className="w-3 h-3" />
                                {employee.employeeCode}
                              </span>
                              <span>•</span>
                              <span>{employee.department}</span>
                              {employee.role && (
                                <>
                                  <span>•</span>
                                  <span>{employee.role}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No HR managers found message */}
                {showHrManagerDropdown &&
                  hrManagerSearch &&
                  filteredHrManagers.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        No HR managers found matching "{hrManagerSearch}"
                      </div>
                    </div>
                  )}
              </div>

              {selectedHrManager && (
                <div className="mt-2 text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <FaUsers />
                  <span>
                    Selected: {selectedHrManager.fullName} (
                    {selectedHrManager.email}) - ID: {selectedHrManager.id}
                  </span>
                </div>
              )}
              <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                Search and select an HR manager for the user
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              isError
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md ${
                  isError
                    ? "bg-red-100 dark:bg-red-800"
                    : "bg-green-100 dark:bg-green-800"
                }`}
              >
                {isError ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-lantern-blue-600 hover:bg-green-950 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <FaUserPlus />
                Register User
              </>
            )}
          </button>

          <p className="text-xs text-center mt-4 text-gray-500 dark:text-gray-400">
            Fields marked with * are required
          </p>
        </div>
      </form>
    </div>
  );
}
