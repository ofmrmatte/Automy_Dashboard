import { toast as sonnerToast, Toaster } from "sonner";

export function ToastViewport() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-card border-border bg-card text-card-foreground shadow-card",
          title: "font-semibold",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
  danger: (message: string) => sonnerToast.error(message),
};
