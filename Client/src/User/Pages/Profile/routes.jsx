import { Navigate, Outlet } from 'react-router-dom';
import Dashboard from './Dashboard';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';
import Profile from './Profile';
import Address from './Address';
import Wishlist from './Wishlist';
import WarehouseTrackingPage from './OrderDetail/WarehouseTrackingPage';

// Cấu hình các routes cho phần tài khoản người dùng
export const profileRoutes = [
  {
    path: '',
    element: <Dashboard />,
  },
  {
    path: 'thong-tin',
    element: <Profile />,
  },
  {
    path: 'dia-chi',
    element: <Address />,
  },
  {
    path: 'don-hang',
    element: <OrderList />,
  },
  {
    path: 'don-hang/:orderId',
    element: <OrderDetail />,
  },
  {
    path: 'don-hang/:orderId/theo-doi-kho',
    element: <WarehouseTrackingPage />,
  },
  {
    path: 'yeu-thich',
    element: <Wishlist />,
  },
  {
    path: '*',
    element: <Navigate to="/tai-khoan" replace />,
  },
];

export default function ProfileRoutes() {
  return <Outlet />;
} 