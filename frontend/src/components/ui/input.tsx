import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
