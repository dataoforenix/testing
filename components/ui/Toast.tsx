"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type ToastTone = "success" | "error" | "info";
type Toast = { id: string; title: string; description?: string; tone: ToastTone };

const ToastContext = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((p) => [...p, { ...toast, id }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  const icon = { success: CheckCircle2, error: XCircle, info: Info };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icon[t.tone];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-auto flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-modal"
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    t.tone === "success"
                      ? "text-brand-600"
                      : t.tone === "error"
                        ? "text-red-500"
                        : "text-navy-600"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-ink-muted">{t.description}</p>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx;
}
