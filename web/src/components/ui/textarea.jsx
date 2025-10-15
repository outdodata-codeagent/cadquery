import { forwardRef } from 'react';
import { clsx } from 'clsx';

export const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={clsx('flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm', className)}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
