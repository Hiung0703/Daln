export const Button = ({ children, className = "", ...props }) => (
    <button
      className={
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-sm " +
        "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
  
  export const GhostButton = ({ children, className = "", ...props }) => (
    <button
      className={
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium " +
        "text-slate-700 hover:bg-slate-100 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
  