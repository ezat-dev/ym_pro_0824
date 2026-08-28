export default function Modal({ title, onClose, children, footer, large, xl }) {
  const sizeClass = xl ? 'mes-modal-xl' : large ? 'mes-modal-lg' : '';
  return (
    <div
      className="mes-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`mes-modal ${sizeClass}`.trim()}>
        <div className="mes-modal-header">
          <h3>{title}</h3>
          <button type="button" className="mes-btn mes-btn-ghost" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="mes-modal-body">{children}</div>
        {footer && <div className="mes-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
