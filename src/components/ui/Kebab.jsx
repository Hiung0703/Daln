export const Kebab = ({ onClick }) => (
    <button onClick={onClick} title="Menu" className="p-2 rounded-full hover:bg-slate-100">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
      </svg>
    </button>
  );
  