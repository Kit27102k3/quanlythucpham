import Login from "../User/Pages/Account/Login";
import ProfileUser from "../User/Pages/Profile/ProfileUser";
import Register from "../User/Pages/Account/Register";
import Contact from "../User/Pages/Contact/Contact";
import Home from "../User/Pages/Home/Home";
import Introduce from "../User/Pages/Introduce/Introduce";
import DefaultProduct from "../User/Pages/Product/DefaultProduct";
import Order from "../User/Pages/Profile/Order";
import OrderDetail from "../User/Pages/Profile/OrderDetail";
import Account from "../User/Pages/Profile/Account";
import FetchProductData from "../User/Until/FetchProductData";
import ProductDetails from "../User/Pages/Product/ProductDetails";
import Cart from "../User/Pages/Cart/Cart";
import Address from "../User/Pages/Profile/Address";
import Payment from "../User/Pages/Cart/Payment";
import ResetPassword from "../User/Pages/Account/ResetPassword";
import Dashboard from "../Admin/Pages/Dashboard";
import Products from "../Admin/Pages/Products";
import Categories from "../Admin/Pages/Categories";
import Customers from "../Admin/Pages/Customers";
import CustomerDetails from "../Admin/Pages/CustomerDetails";
import SearchProducts from "../User/Pages/Product/SearchProducts";
import DefaultDiscount from "../User/Pages/Product/ProductDiscount/DefaultDiscount";
import OrderAdmin from "../Admin/Pages/Order";
import Employees from "../Admin/Pages/AddEmployees";
import OrderConfirmation from "../User/Pages/Cart/OrderConfirmation";
import PaymentResult from "../User/Pages/Cart/PaymentResult";
import PaymentQR from "../User/Pages/Cart/PaymentQR";
import CategoryProducts from "../User/Pages/Product/CategoryProducts";
import TipsManagement from "../Admin/Pages/Tips/TipsManagement";
import TipForm from "../Admin/Pages/Tips/TipForm";
import ContactList from "../Admin/Pages/Contacts/ContactList";
import Checkout from "../User/Pages/Cart/Checkout";
import Messages from "../Admin/Pages/Messages";
import ChatPage from "../User/Pages/Chat/ChatPage";
import Reviews from "../Admin/Pages/Reviews";
import LoginSuccess from "../User/Pages/Account/LoginSuccess";
import CouponList from "../Admin/Pages/CouponList";
import VoucherPage from "../User/Pages/Voucher/VoucherPage";
import SavedVoucher from "../User/Pages/Profile/SavedVoucher";
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
        path: "don-hang/:orderId",
        page: OrderDetail,
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
      {
        path: "tin-nhan",
        page: ChatPage,
      },
      {
        path: "voucher",
        page: SavedVoucher,
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
    path: "/san-pham/:category",
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
    path: "/order-detail/:orderId",
    page: OrderDetail,
  },
  {
    path: "/khuyen-mai",
    page: DefaultDiscount,
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
    path: "/dang-nhap/success",
    page: LoginSuccess,
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
    path: "/payment-qr",
    page: PaymentQR,
  },
  {
    path: "/checkout",
    page: Checkout,
  },
  {
    path: "/dang-ky",
    page: Register,
    layout: null,
  },
  {
    path: "/voucher",
    page: VoucherPage,
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
    path: "/admin/reviews",
    page: Reviews,
  },
  {
    path: "/admin/messages",
    page: Messages,
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
  {
    path: "/admin/tips",
    page: TipsManagement,
  },
  {
    path: "/admin/tips/create",
    page: TipForm,
  },
  {
    path: "/admin/tips/edit/:id",
    page: TipForm,
  },
  {
    path: "/admin/contacts",
    page: ContactList,
  },
  {
    path: "/admin/coupons",
    page: CouponList,
  },
];

export { publicRoutes, privateRoutes };
