import { cloneElement, forwardRef } from 'react';
import { clsx } from 'clsx';

const variants = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  outline: 'border border-border hover:bg-secondary'
};

export const Button = forwardRef(
  ({ className, variant = 'default', asChild = false, children, ...props }, ref) => {
    const classes = clsx(
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      variants[variant],
      className
    );
    if (asChild && typeof children === 'object' && children !== null) {
      return cloneElement(children, {
        className: clsx(children.props.className, classes),
        ref,
        ...props
      });
    }
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
