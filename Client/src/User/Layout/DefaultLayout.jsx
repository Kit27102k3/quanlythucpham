import Footer from "./Footer";
import Header from "./Header";

function DefaultLayout({ children }) {
  return (
    <div className="w-full mb-5">
      <Header />
      <div className="">{children}</div>
      <Footer />
    </div>
  );
}

export default DefaultLayout;
