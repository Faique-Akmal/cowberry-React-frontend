import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import API from '../../api/axios';

interface Department {
  departmentId: number;
  name: string;
  description: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
}

interface ApiResponse {
  message: string;
  department: Department;
}

interface DepartmentsResponse {
  departments: Department[];
}

const DepartmentManagement: React.FC = () => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: ''
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAdminToken(token);
      fetchDepartments();
    } else {
      setError('Admin token not found. Please login first.');
      setFetching(false);
    }
  }, []);

  const fetchDepartments = async () => {
    try {
      setFetching(true);
      setError('');
      
      const response = await API.get(
        `/departments/static_departments`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      
      setDepartments(response.data.departments || []);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          setAdminToken('');
        } else {
          setError('Failed to fetch departments. Please try again.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Department name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Department description is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    if (!adminToken) {
      setError('Admin token is required. Please login first.');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post(
        `/admin/add_departments`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      setSuccess(response.data.message);
      
      setFormData({
        name: '',
        description: ''
      });

      fetchDepartments();

    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response) {
          setError(err.response.data?.message || `Error: ${err.response.status}`);
          
          if (err.response.status === 401 || err.response.status === 403) {
            localStorage.removeItem('token');
            setAdminToken('');
          }
        } else if (err.request) {
          setError('No response received from server. Please check your connection.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    setDeletingId(departmentId);
    setError('');
    setSuccess('');

    try {
      await API.post(
        `/admin/delete_department/${departmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      setSuccess('Department deleted successfully');
      
      setDepartments(prev => prev.filter(dept => dept.departmentId !== departmentId));
      
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response) {
          setError(err.response.data?.message || `Failed to delete department`);
        } else {
          setError('Failed to delete department. Please try again.');
        }
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 backdrop-blur-xl py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please login first to manage departments.
            </p>
          
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 backdrop-blur-xl py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Department Management
              </h1>
              <p className="text-gray-600 mt-2">
                Add, view, and manage departments in the system
              </p>
            </div>
            
          </div>
        </div>

        {/* Alert Messages */}
        <div className="mb-6 space-y-4">
          {error && (
            <div className="glass-card border-l-4 border-red-500 bg-gradient-to-r from-red-50/50 to-red-100/30 backdrop-blur-xl">
              <div className="p-4 flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 font-medium">Error</p>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="glass-card border-l-4 border-green-500 bg-gradient-to-r from-green-50/50 to-green-100/30 backdrop-blur-xl">
              <div className="p-4 flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-green-700 font-medium">Success</p>
                  <p className="text-green-600 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Department Form - Glassmorphism Card */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 lg:p-8">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Add New Department</h2>
                    <p className="text-gray-600 text-sm">Create a new department</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-28">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 ">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-4">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="glass-input w-full pl-12 pr-4 py-3 rounded-xl"
                      placeholder="Enter department name"
                      disabled={loading}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="glass-input w-full pl-12 pr-4 py-3 rounded-xl resize-none"
                      placeholder="Describe the department's purpose"
                      disabled={loading}
                    />
                    <div className="absolute left-4 top-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button bg-cowberry-green-600 text-black w-full py-4 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding Department...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Department
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Departments List - Glassmorphism Card */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Departments List</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Total: <span className="font-semibold text-blue-600">{departments.length}</span> department{departments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchDepartments}
                  disabled={fetching}
                  className="glass-button bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:shadow-lg flex items-center justify-center"
                >
                  <svg className={`w-5 h-5 mr-2 ${fetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {fetching ? 'Refreshing...' : 'Refresh List'}
                </button>
              </div>

              {fetching ? (
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-gray-500 mt-6 font-medium">Loading departments...</p>
                </div>
              ) : departments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No departments found</h3>
                  <p className="text-gray-500 mb-6">Get started by creating your first department</p>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/50 backdrop-blur-xl">
                  <table className="min-w-full divide-y divide-gray-200/50">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-xl">
                        <th scope="col" className="py-4 pl-6 pr-3 text-left text-sm font-semibold text-gray-700">
                          ID
                        </th>
                        <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-gray-700">
                          Department Name
                        </th>
                      
                        <th scope="col" className="relative py-4 pl-3 pr-6 text-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/30 bg-white/30 backdrop-blur-xl">
                      {departments.map((department, index) => (
                        <tr key={department.departmentId} className="hover:bg-white/50 transition-all duration-200">
                          <td className="whitespace-nowrap py-5 pl-6 pr-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                                <span className="text-blue-600 font-bold">#{department.departmentId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-5">
                            <div className="text-sm font-medium text-gray-900">{department.name}</div>
                          </td>
                        
                          <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right">
                            <button
                              onClick={() => handleDeleteDepartment(department.departmentId)}
                              disabled={deletingId === department.departmentId}
                              className="glass-button bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === department.departmentId ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Deleting...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Card - Glassmorphism */}
       
      </div>

      {/* Add these styles to your global CSS or a style tag */}
      <style jsx global>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.07),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        }
        
        .glass-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .glass-button:hover {
          transform: translateY(-2px);
        }
        
        .glass-input {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }
        
        .glass-input:focus {
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .glass-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @media (max-width: 640px) {
          .glass-card {
            margin: 0 -0.5rem;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default DepartmentManagement;