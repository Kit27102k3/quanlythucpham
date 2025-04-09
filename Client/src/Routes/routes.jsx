import Login from "../User/Pages/Account/Login";
import ProfileUser from "../User/Pages/Profile/ProfileUser";
import Register from "../User/Pages/Account/Register";
import Contact from "../User/Pages/Contact/Contact";
import Home from "../User/Pages/Home/Home";
import Introduce from "../User/Pages/Introduce/Introduce";
import DefaultProduct from "../User/Pages/Product/DefaultProduct";
import Order from "../User/Pages/Profile/Order";
import Account from "../User/Pages/Profile/Account";
import FetchProductData from "../User/Until/FetchProductData";
import ProductDetails from "../User/Pages/Product/ProductDetails";
import Cart from "../User/Cart/Cart";
import Address from "../User/Pages/Profile/Address";
import Payment from "../User/Cart/Payment";
import HeadlessSidebar from "../Admin/Layout/Sidebar";
import ResetPassword from "../User/Pages/Account/ResetPassword";
import News from "../User/Pages/News/News";
import Dashboard from "../Admin/Pages/Dashboard";
import Products from "../Admin/Pages/Products";
import Categories from "../Admin/Pages/Categories";
import Customers from "../Admin/Pages/Customers";
import CustomerDetails from "../Admin/Pages/CustomerDetails";
import SearchProducts from "../User/Pages/Product/SearchProducts";
import DefaultDiscount from "../User/Pages/Product/ProductDiscount/DefaultDiscount";
import OrderAdmin from "../Admin/Pages/Order";
import Employees from "../Admin/Pages/AddEmployees";
import OrderConfirmation from "../User/Cart/OrderConfirmation";
import NewsPage from "../User/Pages/NewsPage/NewsPage";
import TipsPage from "../User/Pages/TipsPage/TipsPage";
import PaymentResult from "../User/Pages/PaymentResult";
import CategoryProducts from "../User/Pages/Product/CategoryProducts";

const publicRoutes = [
  {
    path: "/",
    page: Home,
  },
  {
    path: "/tai-khoan/",
    page: ProfileUser,
    children: [
      {
        path: "don-hang",
        page: Order,
      },
      {
        path: "",
        page: Account,
      },
      {
        path: "dia-chi",
        page: Address,
      },
      {
        path: "doi-mat-khau",
        page: ResetPassword,
      },
    ],
  },
  {
    path: "/gioi-thieu",
    page: Introduce,
  },
  {
    path: "/san-pham",
    page: DefaultProduct,
  },
  {
    path: "/products/category/:category",
    page: CategoryProducts,
  },
  {
    path: "/order-confirmation/:orderId",
    page: OrderConfirmation,
  },
  {
    path: "/khuyen-mai",
    page: DefaultDiscount,
  },
  {
    path: "/tin-tuc",
    page: NewsPage,
  },
  {
    path: "/meo-hay",
    page: TipsPage,
  },
  {
    path: "/gio-hang",
    page: Cart,
  },
  {
    path: "/test",
    page: FetchProductData,
  },
  {
    path: "/chi-tiet-san-pham/:slug",
    page: ProductDetails,
  },
  {
    path: "/lien-he",
    page: Contact,
  },
  {
    path: "/search/:query?",
    page: SearchProducts,
  },
  {
    path: "/dang-nhap",
    page: Login,
    layout: null,
  },
  {
    path: "/thanh-toan/:paymentId",
    page: Payment,
    layout: null,
  },
  {
    path: "/payment-result",
    page: PaymentResult,
  },
  {
    path: "/dang-ky",
    page: Register,
    layout: null,
  },
];

const privateRoutes = [
  {
    path: "/admin",
    page: Dashboard,
  },
  {
    path: "/admin/dashboard",
    page: Dashboard,
  },
  {
    path: "/admin/products",
    page: Products,
  },
  {
    path: "/admin/categories",
    page: Categories,
  },
  {
    path: "/admin/orders",
    page: OrderAdmin,
  },
  {
    path: "/admin/customers",
    page: Customers,
  },
  {
    path: "/admin/employees",
    page: Employees,
  },
  {
    path: "/admin/customers/details/:id",
    page: CustomerDetails,
    layout: null,
  },
];

export { publicRoutes, privateRoutes };
