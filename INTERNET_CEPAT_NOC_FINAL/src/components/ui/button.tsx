import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva("inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-orange-600 text-white hover:bg-orange-700", outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50", ghost: "text-slate-600 hover:bg-slate-100", destructive: "bg-red-600 text-white hover:bg-red-700" } }, defaultVariants: { variant: "default" } })
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, ...props }, ref) => <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />)
Button.displayName = "Button"
