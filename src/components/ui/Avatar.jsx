export const Avatar = ({ name = "" }) => (
    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
  