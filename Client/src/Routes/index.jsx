import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../Admin/components/ProtectedRoute";
import AdminLayout from "../Admin/components/AdminLayout";
import Login from "../User/Pages/Account/Login";
import Dashboard from "../Admin/Pages/Dashboard";
import AddEmployees from "../Admin/Pages/AddEmployees";
import { AddProduct, EditProduct } from "../Admin/Pages/Products";
import ProductList from "../Admin/Pages/ProductList";
import CategoryList from "../Admin/Pages/CategoryList";
import OrderList from "../Admin/Pages/OrderList";
import UserList from "../Admin/Pages/UserList";
import ContactList from "../Admin/Pages/Contacts/ContactList";
import Home from "../User/Pages/Home";
import ProductDetail from "../User/Pages/ProductDetail";
import Cart from "../User/Pages/Cart";
import Checkout from "../User/Pages/Checkout";
import OrderHistory from "../User/Pages/OrderHistory";
import Profile from "../User/Pages/Profile";
import CouponList from "../Admin/Pages/CouponList";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin/login" element={<Login />} />
      
      {/* Protected Admin Routes with Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <AdminLayout>
              <AddEmployees />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ProductList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/add"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AddProduct />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/edit/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <EditProduct />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <CategoryList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <CouponList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <OrderList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contacts"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ContactList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout>
              <UserList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* User Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<OrderHistory />} />
      <Route path="/profile" element={<Profile />} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 