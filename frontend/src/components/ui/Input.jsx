export const Input = ({ label, error, className = '', id, ...props }) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-300">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-honey-400 focus:border-honey-400 transition dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 ${
        error ? 'border-red-400' : 'border-stone-300 dark:border-stone-700'
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
