export const Label = ({ children }) => (
    <label className="text-sm font-medium text-slate-700 mb-1 block">{children}</label>
  );
  
  export const Input = ({ className = "", ...props }) => (
    <input
      className={
        "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 " +
        className
      }
      {...props}
    />
  );
  