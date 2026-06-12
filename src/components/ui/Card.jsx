import React from "react";

export function Card({
  children,
  className = "",
  variant = "glass", // glass, solid, outline
  hoverable = false,
  onClick = null
}) {
  const baseStyles = "rounded-2xl transition-all duration-300 overflow-hidden border";
  
  const variants = {
    // Glassmorphism (Default)
    glass: "bg-white/85 backdrop-blur-md border-slate-200/80 text-slate-800 shadow-xl shadow-slate-200/40 dark:bg-slate-950/40 dark:border-slate-800/40 dark:text-slate-100 dark:shadow-black/10",
    // Solid background
    solid: "bg-white border-slate-200 text-slate-800 shadow-md dark:bg-[#121829] dark:border-slate-800 dark:text-slate-100",
    // Outline style
    outline: "bg-transparent border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
  };

  const hoverStyles = hoverable 
    ? "hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/5 hover:border-slate-350 dark:hover:border-slate-700/60 cursor-pointer active:scale-[0.99]" 
    : "";

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`px-5 py-4 border-b border-slate-200 dark:border-slate-800/40 flex items-center justify-between gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`px-5 py-4 border-t border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/20 flex items-center justify-between gap-4 ${className}`}>
      {children}
    </div>
  );
}
