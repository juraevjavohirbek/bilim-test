import editIcon from "../assets/edit.svg";
import trashIcon from "../assets/trash.svg";

export default function EditActions({ label, onEdit, onDelete }) {
  return (
    <div className="edit-actions">
      <button type="button" className="icon-button" aria-label={`${label} — tahrirlash`} onClick={onEdit}>
        <img src={editIcon} alt="" />
      </button>
      <button type="button" className="icon-button icon-danger" aria-label={`${label} — o‘chirish`} onClick={onDelete}>
        <img src={trashIcon} alt="" />
      </button>
    </div>
  );
}
