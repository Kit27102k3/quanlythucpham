import { Routes, Route, Link } from "react-router-dom";
import { publicRoutes, privateRoutes } from "./Routes/routes";
import DefaultLayout from "./User/Layout/DefaultLayout";
import HeaderAdmin from "./Admin/Layout/HeaderAdmin";
import BlockedAccountAlert from "./User/component/BlockedAccountAlert";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    // Nếu đang ở trang FE user và là admin/manager/employee thì chuyển hướng
    if (["admin", "manager", "employee"].includes(userRole)) {
      // Chỉ chuyển hướng nếu không phải đang ở trang admin
      if (!location.pathname.startsWith("/admin")) {
        navigate("/admin/products", { replace: true });
      }
    }
  }, [location, navigate]);

  return (
    <div className="app-container">
      <BlockedAccountAlert />
      <nav className="hidden">
        <ul>
          {publicRoutes.map((route, index) => (
            <li key={index}>
              <Link to={route.path}>{route.name}</Link>{" "}
            </li>
          ))}
        </ul>
      </nav>

      <Routes>
        {publicRoutes.map((route, index) =>
          route.children ? (
            <Route
              key={index}
              path={route.path}
              element={
                route.layout === null ? (
                  <route.page />
                ) : (
                  <DefaultLayout>
                    <route.page />
                  </DefaultLayout>
                )
              }
            >
              {route.children.map((child, idx) => (
                <Route key={idx} path={child.path} element={<child.page />} />
              ))}
            </Route>
          ) : (
            <Route
              key={index}
              path={route.path}
              element={
                route.layout === null ? (
                  <route.page />
                ) : (
                  <DefaultLayout>
                    <route.page />
                  </DefaultLayout>
                )
              }
            />
          )
        )}

        {privateRoutes.map((route, index) =>
          route.children ? (
            <Route
              key={index}
              path={route.path}
              element={
                route.layout === null ? (
                  <route.page />
                ) : (
                  <HeaderAdmin>
                    <route.page />
                  </HeaderAdmin>
                )
              }
            >
              {route.children.map((child, idx) => (
                <Route key={idx} path={child.path} element={<child.page />} />
              ))}
            </Route>
          ) : (
            <Route
              key={index}
              path={route.path}
              element={
                route.layout === null ? (
                  <route.page />
                ) : (
                  <HeaderAdmin>
                    <route.page />
                  </HeaderAdmin>
                )
              }
            />
          )
        )}
      </Routes>
      
    </div>
  );
}

export default App;
