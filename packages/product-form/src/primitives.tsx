"use client";
import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "./lib/utils";

/* Button */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"ghost"|"outline"|"danger"|"info"; size?: "xs"|"sm"|"md"|"lg"|"icon"; loading?: boolean; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(({ variant="primary", size="md", loading, leftIcon, rightIcon, children, className, disabled, ...p }, ref) => (
  <motion.button ref={ref} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} transition={{ duration: 0.12 }} disabled={disabled||loading}
    className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      size==="xs"&&"h-7 px-2.5 text-xs", size==="sm"&&"h-8 px-3 text-sm", size==="md"&&"h-10 px-4 text-sm", size==="lg"&&"h-12 px-6 text-base", size==="icon"&&"h-10 w-10",
      variant==="primary"&&"bg-primary text-white hover:bg-primary/90 shadow-sm", variant==="secondary"&&"bg-secondary text-secondary-foreground hover:bg-secondary/80",
      variant==="ghost"&&"hover:bg-accent text-foreground", variant==="outline"&&"border border-border bg-transparent hover:bg-accent text-foreground",
      variant==="danger"&&"bg-red-500 text-white hover:bg-red-600",
      variant==="info"&&"bg-blue-600 text-white hover:bg-blue-700 shadow-sm", className)} {...(p as any)}>
    {loading?<Loader2 className="h-4 w-4 animate-spin"/>:leftIcon}{children}{!loading&&rightIcon}
  </motion.button>
));
Button.displayName = "Button";

/* Input */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode; }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, leftIcon, rightIcon, className, id, ...p }, ref) => {
  const iid = id ?? label?.toLowerCase().replace(/\s+/g,"-");
  return (
    <div className="space-y-1.5">
      {label&&<label htmlFor={iid} className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        {leftIcon&&<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</div>}
        <input ref={ref} id={iid} className={cn("w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 disabled:opacity-50 transition-all", leftIcon&&"pl-9", rightIcon&&"pr-9", error&&"border-red-400", className)} aria-invalid={!!error} {...p}/>
        {rightIcon&&<div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightIcon}</div>}
      </div>
      {error&&<p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";
