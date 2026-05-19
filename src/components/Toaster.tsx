import {createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {CheckCircle2, CircleAlert, Info, X} from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastApi = {
  notify: (tone: ToastTone, message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToasterProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (tone: ToastTone, message: string) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => [...current, {id, tone, message}]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{notify}}>
      {children}
      <div className="toaster" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? CircleAlert : Info;
          return (
            <div key={toast.id} className={`toast toast--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
              <Icon size={16} aria-hidden="true" />
              <span>{toast.message}</span>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToasterProvider');
  return ctx;
}
