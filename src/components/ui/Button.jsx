import React from "react";

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary, secondary, danger, outline, link, accent
  size = "md", // sm, md, lg
  className = "",
  disabled = false,
  isLoading = false,
  icon: Icon = null,
  iconPosition = "left"
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";
  
  const variants = {
    primary: "bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 hover:brightness-110 focus:ring-sky-400",
    accent: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:brightness-110 focus:ring-amber-400",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700/50 dark:hover:bg-slate-700 dark:focus:ring-slate-600",
    outline: "bg-transparent text-sky-500 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500/10 focus:ring-sky-500/40",
    danger: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/15 hover:brightness-110 focus:ring-rose-400",
    link: "bg-transparent text-sky-500 dark:text-sky-400 hover:underline hover:text-sky-400 dark:hover:text-sky-300 focus:ring-transparent p-0 active:scale-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />}
          {children}
          {Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />}
        </>
      )}
    </button>
  );
}
