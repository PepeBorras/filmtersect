import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/70 bg-white/50 px-3 py-2 text-[15px] tracking-tight text-stone-900 placeholder:text-stone-500/65 shadow-[0_10px_22px_-20px_rgba(30,24,18,0.55)] transition-colors duration-150 focus:border-stone-400/80 focus:bg-white/70 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
