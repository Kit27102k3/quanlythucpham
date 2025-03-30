import { toast } from "react-toastify";

const showToast = (type, title, message) => {
  toast.success(`${title}: ${message}`);
};

export default showToast;
