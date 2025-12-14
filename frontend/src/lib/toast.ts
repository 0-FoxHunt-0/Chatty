import toast from "react-hot-toast";

// Dismiss all previous toasts before showing a new one
const dismissAll = () => {
  toast.dismiss();
};

export const showToast = {
  success: (message: string) => {
    dismissAll();
    toast.success(message);
  },
  error: (message: string) => {
    dismissAll();
    toast.error(message);
  },
  loading: (message: string) => {
    dismissAll();
    return toast.loading(message);
  },
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    dismissAll();
    return toast.promise(promise, messages);
  },
};
