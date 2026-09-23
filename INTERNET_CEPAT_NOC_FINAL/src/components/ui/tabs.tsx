"use client"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react"
import { cn } from "@/lib/utils"
export const Tabs = TabsPrimitive.Root
export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => <TabsPrimitive.List ref={ref} className={cn("flex gap-1 border-b border-slate-200", className)} {...props} />)
export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => <TabsPrimitive.Trigger ref={ref} className={cn("border-b-2 border-transparent px-3 py-2 text-sm text-slate-500 data-[state=active]:border-orange-600 data-[state=active]:text-slate-900", className)} {...props} />)
export const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn("pt-4", className)} {...props} />)
