import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium font-arabic transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary-800 text-white hover:bg-primary-900 shadow-md hover:shadow-lg",
        destructive:
          "bg-red-700 text-white hover:bg-red-800 shadow-md hover:shadow-lg",
        outline:
          "border-2 border-gray-400 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-500 shadow-md hover:shadow-lg",
        secondary:
          "bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-md hover:shadow-lg border border-gray-300",
        ghost: "text-gray-800 hover:bg-gray-100 hover:text-gray-900",
        link: "text-primary-800 underline-offset-4 hover:underline hover:text-primary-900 font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
