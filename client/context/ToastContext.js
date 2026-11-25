"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
const ToastContext = createContext(undefined);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const showToast = useCallback((message, type = "info", title) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newToast = { id, type, title, message };
        setToasts((prev) => [...prev, newToast]);
        setTimeout(() => {
            removeToast(id);
        }, 4200);
    }, [removeToast]);
    const success = useCallback((message, title) => showToast(message, "success", title), [showToast]);
    const error = useCallback((message, title) => showToast(message, "error", title), [showToast]);
    const info = useCallback((message, title) => showToast(message, "info", title), [showToast]);
    const warning = useCallback((message, title) => showToast(message, "warning", title), [showToast]);
    return (<ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isError = toast.type === "error";
            const isWarning = toast.type === "warning";
            const bgClass = isSuccess
                ? "bg-emerald-950/90 text-emerald-100 border-emerald-800 shadow-emerald-950/30"
                : isError
                    ? "bg-rose-950/90 text-rose-100 border-rose-800 shadow-rose-950/30"
                    : isWarning
                        ? "bg-amber-950/90 text-amber-100 border-amber-800 shadow-amber-950/30"
                        : "bg-slate-900/95 text-slate-100 border-slate-700 shadow-slate-950/40";
            return (<div key={toast.id} role="alert" className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${bgClass}`}>
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400"/>}
                {isError && <AlertCircle className="h-4 w-4 text-rose-400"/>}
                {isWarning && <AlertTriangle className="h-4 w-4 text-amber-400"/>}
                {!isSuccess && !isError && !isWarning && <Info className="h-4 w-4 text-sky-400"/>}
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && (<p className="text-xs font-semibold leading-tight mb-0.5">
                    {toast.title}
                  </p>)}
                <p className="text-xs leading-relaxed opacity-90 break-words">
                  {toast.message}
                </p>
              </div>

              <button type="button" onClick={() => removeToast(toast.id)} className="shrink-0 rounded p-1 opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss notification">
                <X className="h-3.5 w-3.5"/>
              </button>
            </div>);
        })}
      </div>
    </ToastContext.Provider>);
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
