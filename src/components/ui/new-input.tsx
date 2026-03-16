import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const NewInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full border-0 border-b border-white/10 bg-transparent px-0 py-4 text-white placeholder:text-white/20 focus:border-white focus:ring-0 transition-all font-light",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
NewInput.displayName = "NewInput"

export { NewInput }
