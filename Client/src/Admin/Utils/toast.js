import { toast } from 'sonner';

// Helper function để hiển thị toast
export const showToast = (severity, summary, detail) => {
  switch (severity) {
    case 'success':
      toast.success(summary, {
        description: detail,
        position: 'top-right',
      });
      break;
    case 'error':
      toast.error(summary, {
        description: detail,
        position: 'top-right',
      });
      break;
    case 'info':
      toast.info(summary, {
        description: detail,
        position: 'top-right',
      });
      break;
    case 'warning':
      toast.warning(summary, {
        description: detail,
        position: 'top-right',
      });
      break;
    default:
      toast(summary, {
        description: detail,
        position: 'top-right',
      });
  }
}; 