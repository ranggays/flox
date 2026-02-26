"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";
interface ToastProps { message: string; type: ToastType; onClose: () => void; }

const TOAST_CONFIG: Record<ToastType, { icon: string; cls: string }> = {
  success: { icon: "check_circle", cls: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200" },
  error:   { icon: "cancel",       cls: "bg-red-50   dark:bg-red-900/30   border-red-200   dark:border-red-700   text-red-800   dark:text-red-200"   },
  warning: { icon: "warning",      cls: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200" },
  info:    { icon: "info",         cls: "bg-blue-50  dark:bg-blue-900/30  border-blue-200  dark:border-blue-700  text-blue-800  dark:text-blue-200"  },
};

function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const { icon, cls } = TOAST_CONFIG[type];

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose]);

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-300 ${cls} ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    }`}>
      <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">{icon}</span>
      <p className="text-sm font-medium leading-snug flex-1">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}

interface ToastItem { id: number; message: string; type: ToastType; }
let _setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null;

export function useToast() {
  const toast = (message: string, type: ToastType = "info") =>
    _setToasts?.(prev => [...prev, { id: Date.now(), message, type }]);
  return {
    toast,
    success: (msg: string) => toast(msg, "success"),
    error:   (msg: string) => toast(msg, "error"),
    warning: (msg: string) => toast(msg, "warning"),
    info:    (msg: string) => toast(msg, "info"),
  };
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  _setToasts = setToasts;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-99999 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast message={t.message} type={t.type}
            onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        </div>
      ))}
    </div>
  );
}

export interface ConfirmOptions {
  title:         string;
  description?:  string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:      "danger" | "warning" | "info";
}

type ConfirmResolver = (value: boolean) => void;
let _showConfirm: ((opts: ConfirmOptions, resolve: ConfirmResolver) => void) | null = null;

export function useConfirm() {
  return (opts: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => { _showConfirm?.(opts, resolve); });
}

const CONFIRM_VARIANT = {
  danger:  { icon: "warning", iconCls: "text-red-500   bg-red-50   dark:bg-red-900/30",   btn: "bg-red-600   hover:bg-red-700   text-white" },
  warning: { icon: "error",   iconCls: "text-amber-500 bg-amber-50 dark:bg-amber-900/30", btn: "bg-amber-500 hover:bg-amber-600 text-white" },
  info:    { icon: "help",    iconCls: "text-[#5048e5] bg-blue-50  dark:bg-blue-900/30",  btn: "bg-[#5048e5] hover:bg-[#4338ca] text-white" },
};

interface ConfirmState extends ConfirmOptions { resolve: ConfirmResolver; }

export function ConfirmProvider() {
  const [state, setState] = useState<ConfirmState | null>(null);
  _showConfirm = (opts, resolve) => setState({ ...opts, resolve });

  const handle = (value: boolean) => { state?.resolve(value); setState(null); };
  if (!state) return null;

  const { icon, iconCls, btn } = CONFIRM_VARIANT[state.variant ?? "danger"];

  return (
    <div className="fixed inset-0 z-100000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handle(false)} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <div className="flex-1 pt-1">
            <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{state.title}</p>
            {state.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{state.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => handle(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {state.cancelLabel ?? "Cancel"}
          </button>
          <button onClick={() => handle(true)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${btn}`}>
            {state.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}