import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "./ui/Button";
import { Card, CardBody } from "./ui/Card";
import { Input } from "./ui/Input";
import { 
  Zap, 
  History, 
  LogOut, 
  Cloud, 
  CloudOff, 
  Lock, 
  User, 
  Sun, 
  Moon, 
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Send
} from "lucide-react";

export default function Layout({ children, activeTab, setActiveTab }) {
  const { 
    isOnline, 
    apiUrl, 
    isAuthenticated, 
    username, 
    login, 
    logout,
    offlineQueueLength,
    isLoading,
    syncStatus 
  } = useApp();

  const [pin, setPin] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark"; // default false (light mode)
  });

  // Efek untuk menyinkronkan class root HTML dengan state tema
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Fungsi toggle dark mode
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    login(pin, nameInput);
  };



  // 1. Tampilan jika belum Login (PIN Authentication Screen)
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-800 dark:from-slate-950 dark:via-[#0B0F19] dark:to-slate-900 dark:text-slate-100`}>
        <Card variant="glass" className="w-full max-w-md p-6 border-slate-200/80 dark:border-slate-800/80 shadow-2xl relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
          
          <CardBody className="flex flex-col gap-6 p-0">
            {/* Header / Logo */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-amber-500 p-0.5 shadow-lg shadow-sky-500/10 animate-pulse-soft">
                <div className="h-full w-full rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-sky-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-855 dark:text-white mt-2">EDDP ENTERPRISE</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">
                Executive Daily Distribution Performance PLN Salatiga Kota
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <Input
                label="Nama / Username"
                name="name"
                type="text"
                placeholder="Masukkan nama/username..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                icon={User}
                required
              />
              <Input
                label="Password / PIN"
                name="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Masukkan password/PIN..."
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                icon={Lock}
                required
              />
              
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full py-3 mt-2 font-semibold"
                disabled={pin.length < 4 || isLoading}
                isLoading={isLoading}
              >
                Masuk ke Aplikasi
              </Button>
            </form>

            <div className="text-center">
              <p className="text-[10px] text-slate-450 dark:text-slate-500">
                PWA ini dilindungi PIN keamanan ULP. Silakan tanyakan administrator untuk akses.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Toast Notification System on Login Page */}
        {syncStatus.show && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold max-w-sm w-11/12 md:w-auto
            bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800/80 dark:text-slate-100"
          >
            {syncStatus.type === "success" && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
            {syncStatus.type === "error" && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
            {syncStatus.type === "warning" && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
            {syncStatus.type === "info" && <Info size={16} className="text-sky-500 shrink-0" />}
            
            <span className="leading-tight">{syncStatus.message}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. Tampilan Utama (Setelah Authenticated)
  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-800 transition-colors duration-350 dark:bg-[#0B0F19] dark:text-slate-200`}>
      {/* Top Header / Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-sky-500 dark:text-sky-400" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">EDDP MOBILE</h1>
            <p className="text-[9px] font-medium text-sky-500 dark:text-sky-400 uppercase tracking-widest animate-pulse">Salatiga Kota</p>
          </div>
        </div>
        
        {/* Right Header Actions */}
        <div className="flex items-center gap-1">
          {/* Status Internet */}
          <div 
            title={isOnline ? "Online" : "Offline"}
            className={`flex items-center justify-center p-2 transition-all duration-300 ${
              isOnline 
                ? "text-sky-500 dark:text-sky-400" 
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {isOnline ? (
              <Cloud size={15} className="animate-cloud-pulse" />
            ) : (
              <CloudOff size={15} />
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-205 cursor-pointer overflow-hidden transition-all duration-200 active:scale-90"
            aria-label="Toggle Theme"
          >
            <div className="relative w-4.5 h-4.5 flex items-center justify-center">
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                  isDarkMode 
                    ? "rotate-90 scale-0 opacity-0" 
                    : "rotate-0 scale-100 opacity-100"
                }`}
              >
                <Sun 
                  size={15} 
                  className="text-yellow-500 dark:text-yellow-400 animate-spin-slow" 
                />
              </div>
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                  isDarkMode 
                    ? "rotate-0 scale-100 opacity-100" 
                    : "-rotate-90 scale-0 opacity-0"
                }`}
              >
                <Moon 
                  size={15} 
                  className="text-sky-400 dark:text-sky-400 animate-float-slow" 
                />
              </div>
            </div>
          </button>
          
          {/* Logout */}
          <button 
            onClick={logout}
            title="Keluar"
            className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-450 cursor-pointer transition-all duration-200"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Offline Queue Sync Indicator */}
      {offlineQueueLength > 0 && (
        <div className="bg-amber-550 text-slate-950 text-center text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle size={14} />
          <span>Terdapat {offlineQueueLength} data offline siap disinkronisasikan ke Google Sheets.</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6 animate-fade-in">
        {children}
      </main>

      {/* Bottom Navigation Tab Bar (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-900 backdrop-blur-md pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          {/* Form Tab */}
          <button
            onClick={() => setActiveTab("form")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "form" 
                ? "text-sky-600 dark:text-sky-400" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <Zap size={20} className={activeTab === "form" ? "scale-110 text-sky-600 dark:text-sky-400" : ""} />
            <span className="text-[10px] font-semibold">Buat Laporan</span>
          </button>

          {/* Preview Tab (Paper plane rotated icon) */}
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "preview" 
                ? "text-sky-600 dark:text-sky-400" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <Send 
              size={20} 
              className={`transform -rotate-45 transition-all ${
                activeTab === "preview" 
                  ? "scale-110 text-sky-600 dark:text-sky-400" 
                  : ""
              }`} 
            />
            <span className="text-[10px] font-semibold">Preview WA</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "history" 
                ? "text-sky-600 dark:text-sky-400" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <History size={20} className={activeTab === "history" ? "scale-110 text-sky-600 dark:text-sky-400" : ""} />
            <span className="text-[10px] font-semibold">Riwayat</span>
          </button>


        </div>
      </nav>

      {/* Toast Notification System on Authenticated Page */}
      {syncStatus.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold max-w-sm w-11/12 md:w-auto
          bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800/80 dark:text-slate-100"
        >
          {syncStatus.type === "success" && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
          {syncStatus.type === "error" && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
          {syncStatus.type === "warning" && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
          {syncStatus.type === "info" && <Info size={16} className="text-sky-500 shrink-0" />}
          
          <span className="leading-tight">{syncStatus.message}</span>
        </div>
      )}
    </div>
  );
}
