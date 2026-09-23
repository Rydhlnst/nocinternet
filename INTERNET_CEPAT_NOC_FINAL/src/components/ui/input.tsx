import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500", className)} {...props} />)
Input.displayName = "Input"
