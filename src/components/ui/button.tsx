import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "h-10 bg-navy px-4 text-paper hover:bg-navy/90",
        secondary: "is-link h-auto min-h-0 bg-transparent px-0 text-navy underline-offset-4 hover:underline",
        outline: "is-link h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-navy underline-offset-4 hover:underline",
        ghost: "is-link h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-navy/75 underline-offset-4 hover:underline",
        saffron: "h-10 bg-navy px-4 text-paper hover:bg-navy/90",
        forest: "h-10 bg-[#1d4a38] px-4 text-paper hover:bg-[#1d4a38]/90",
        danger: "h-10 bg-transparent px-0 text-[#8d2b2b] underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "text-sm",
        lg: "h-11 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
