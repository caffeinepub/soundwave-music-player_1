interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <output
      data-ocid="toast"
      className={`toast-msg${visible ? " show" : ""}`}
      aria-live="polite"
    >
      {message}
    </output>
  );
}
