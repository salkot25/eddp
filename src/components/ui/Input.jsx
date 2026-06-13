import React from "react";

export function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  helperText = "",
  disabled = false,
  required = false,
  className = "",
  icon: Icon = null,
  min = undefined,
  max = undefined,
  step = undefined,
  onFocus = null,
  onBlur = null,
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="text-[10px] font-bold tracking-widest text-slate-450 dark:text-slate-500 select-none uppercase">
          {label} {required && <span className="text-rose-500/90">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 
            ${Icon ? "pl-11" : ""}
            bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500
            border border-slate-200 dark:border-slate-800/60 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/15
            disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />
      </div>
      
      {error && <span className="text-xs text-rose-500 font-medium select-none">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500 dark:text-slate-400 select-none">{helperText}</span>}
    </div>
  );
}
