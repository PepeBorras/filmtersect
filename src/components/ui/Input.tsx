import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full border-0 border-b border-stone-400/55 bg-transparent px-0 py-1.5 text-[15px] tracking-tight text-stone-900 placeholder:text-stone-500/65 transition-colors duration-150 focus:border-stone-700 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
