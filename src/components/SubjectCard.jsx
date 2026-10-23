import { NavLink } from "react-router-dom"

function SubjectCard({icon, title}) {
  return (
    <NavLink to={`/subjects/${encodeURIComponent(title)}`} className="subject-card">
      <span className="subject-icon-box" aria-hidden="true">
        <img className="subject-icon" src={icon} alt={title} />
      </span>

      <div className="subject-info">
        <h3>{title}</h3>
        <p>Testlar va mavzular</p>
      </div>
    </NavLink>
  );
}

export default SubjectCard;
