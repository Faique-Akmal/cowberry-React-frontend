// src/admin/AdminRouter.tsx

import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";


export default function AdminRouter() {
  return (
    <AdminLayout>
      <Routes>
        {/* <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} /> */}
      </Routes>
    </AdminLayout>
  );
}
