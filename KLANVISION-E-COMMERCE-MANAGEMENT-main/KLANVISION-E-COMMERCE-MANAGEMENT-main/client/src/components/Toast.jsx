export default function Toast({ toast }) {
  if (!toast) return null;
  return <div key={toast.key} className={`toast toast-${toast.type}`} role="status">{toast.message}</div>;
}
