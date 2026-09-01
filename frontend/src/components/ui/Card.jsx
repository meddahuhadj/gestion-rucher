export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-2xl shadow-card border border-stone-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-stone-100 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
);
