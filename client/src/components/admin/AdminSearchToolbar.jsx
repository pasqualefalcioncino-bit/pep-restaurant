import './AdminSearchToolbar.css';

const AdminSearchToolbar = ({
  id,
  label = 'Cerca',
  placeholder,
  value,
  onChange,
  resultsCount,
}) => {
  return (
    <div className="admin-search-toolbar">
      <label className="admin-search-field" htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <span className="admin-search-results">{resultsCount} risultati</span>
    </div>
  );
};

export default AdminSearchToolbar;
