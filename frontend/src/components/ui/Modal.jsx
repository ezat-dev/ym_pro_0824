export default function Modal({ title, onClose, children, footer, large }) {
  return (
    <div
      className="mes-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={large ? 'mes-modal mes-modal-lg' : 'mes-modal'}>
        <div className="mes-modal-header">
          <h3>{title}</h3>
          <button type="button" className="mes-btn mes-btn-ghost" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="mes-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
