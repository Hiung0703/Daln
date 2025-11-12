export const Card = ({ className = "", children }) => (
    <div className={"bg-white shadow-sm rounded-2xl border border-slate-200 " + className}>{children}</div>
  );
  
  export const CardHeader = ({ title, right }) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {right}
    </div>
  );
  
  export const CardBody = ({ className = "", children }) => (
    <div className={"p-4 " + className}>{children}</div>
  );
  