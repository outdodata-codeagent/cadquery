import { forwardRef } from 'react';
import { clsx } from 'clsx';

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={clsx('flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm', className)}
      {...props}
    />
  );
});

Input.displayName = 'Input';
