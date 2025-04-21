import { toast } from 'sonner';

/**
 * Hiển thị thông báo toast với các loại khác nhau
 * @param {string} type - Loại thông báo (success, error, info, warning)
 * @param {string} message - Nội dung thông báo
 */
const showToast = (type, message) => {
  if (!message) return;
  
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
      toast.info(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    default:
      toast(message);
  }
};

export default showToast; 