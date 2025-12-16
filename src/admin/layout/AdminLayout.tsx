// src/admin/layout/AdminLayout.tsx

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white">
        <nav>
          <a href="/admin">Dashboard</a>
          <a href="/admin/users">Users</a>
          <a href="/admin/settings">Settings</a>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
