import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { publicRoutes, privateRoutes } from "./Routes/routes";
import DefaultLayout from "./User/Layout/DefaultLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HeaderAdmin from "./Admin/Layout/HeaderAdmin";

function App() {
  return (
    <>
      <Router>
        <nav>
          <ul>
            {publicRoutes.map((route, index) => (
              <li key={index}>
                <Link to={Route.path}>{route.name}</Link>
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
          {privateRoutes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={
                <HeaderAdmin>
                  <route.page />
                </HeaderAdmin>
              }
            />
          ))}
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
