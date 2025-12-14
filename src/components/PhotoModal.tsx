interface PhotoModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
}

export function PhotoModal({ isOpen, imageSrc, onClose }: PhotoModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`overlay photo-modal ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="photo-modal-content">
        <button className="close-modal-btn" onClick={onClose}>
          ✕
        </button>
        <img id="modal-photo" src={imageSrc} alt="Quiz foto" />
      </div>
    </div>
  );
}
