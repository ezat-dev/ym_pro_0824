export default function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`mes-toast ${toast.type}`}>{toast.message}</div>;
}
