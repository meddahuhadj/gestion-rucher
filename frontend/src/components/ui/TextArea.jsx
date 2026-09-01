export const TextArea = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
    )}
    <textarea
      className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-honey-400 focus:border-honey-400 transition ${
        error ? 'border-red-400' : 'border-stone-300'
      } ${className}`}
      rows={4}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
