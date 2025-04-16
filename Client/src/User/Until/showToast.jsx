import { toast } from "sonner";

const showToast = (type, title, message) => {
  toast.success(`${title}: ${message}`);
};

export default showToast;
