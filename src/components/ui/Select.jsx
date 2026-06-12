import React from "react";

export function Select({
  label,
  name,
  value,
  onChange,
  options = [], // [{ value, label }] or [string]
  error = "",
  disabled = false,
  required = false,
  className = "",
  icon: Icon = null
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 select-none uppercase">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-slate-450 dark:text-slate-500 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full py-2.5 px-4 pr-10 rounded-xl text-sm font-medium transition-all duration-200 appearance-none
            ${Icon ? "pl-11" : ""}
            bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-100
            border border-slate-200 dark:border-slate-800/60 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/15
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {options.map((opt, idx) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const lbl = typeof opt === "object" ? opt.label : opt;
            return (
              <option key={idx} value={val} className="bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
                {lbl}
              </option>
            );
          })}
        </select>
        
        <div className="absolute right-4 pointer-events-none text-slate-400">
          <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && <span className="text-xs text-rose-500 font-medium select-none">{error}</span>}
    </div>
  );
}
