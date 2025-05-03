import { Routes, Route, Link } from "react-router-dom";
import { publicRoutes, privateRoutes } from "./Routes/routes";
import DefaultLayout from "./User/Layout/DefaultLayout";
import HeaderAdmin from "./Admin/Layout/HeaderAdmin";
import BlockedAccountAlert from "./User/component/BlockedAccountAlert";
import FixPaymentStatus from './components/FixPaymentStatus';

function App() {
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
        <Route path="/fix-payment" element={<FixPaymentStatus />} />
      </Routes>
      
    </div>
  );
}

export default App;
