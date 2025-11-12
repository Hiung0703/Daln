export const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={"inline-flex h-6 w-11 items-center rounded-full transition-colors " + (checked ? "bg-indigo-600" : "bg-slate-300")}
    >
      <span className={"h-5 w-5 transform rounded-full bg-white shadow transition-transform " + (checked ? "translate-x-5" : "translate-x-1")} />
    </button>
  );
  