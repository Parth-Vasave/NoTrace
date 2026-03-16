import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-white text-black hover:bg-white/90 px-10 py-5",
        outline: "border border-white text-white hover:bg-white hover:text-black px-10 py-5",
        ghost: "text-white/60 hover:text-white border-b border-transparent hover:border-white px-4 py-5",
        kill: "border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white px-8 py-3",
        secondary_outline: "border border-white/20 text-white/40 hover:border-white hover:text-white px-8 py-3",
        icon: "h-10 w-10 border border-white flex items-center justify-center text-white",
      },
      size: {
        default: "",
        sm: "px-6 py-2",
        lg: "px-12 py-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const NewButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NewButton.displayName = "NewButton"

export { NewButton, buttonVariants }
