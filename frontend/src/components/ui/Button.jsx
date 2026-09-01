export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-honey-500 text-white hover:bg-honey-600 shadow-sm',
    secondary: 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 dark:border-stone-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    ghost: 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};
