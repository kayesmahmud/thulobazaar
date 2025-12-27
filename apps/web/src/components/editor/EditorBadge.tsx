interface EditorBadgeProps {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export function EditorBadge({ label, variant, size = 'md' }: EditorBadgeProps) {
  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-teal-100 text-teal-800 border-teal-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full font-semibold border inline-block`}
    >
      {label}
    </span>
  );
}
