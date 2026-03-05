import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  loading,
  disabled,
  fullWidth,
  ...props
}) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="btn__spinner" />
      ) : Icon ? (
        <Icon size={size === 'small' ? 16 : 20} />
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
