/* eslint-disable react/prop-types */
import AdminSidebar from "./Sidebar";

function HeaderAdmin({ children }) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">{children}</div>
    </div>
  );
}

export default HeaderAdmin;
