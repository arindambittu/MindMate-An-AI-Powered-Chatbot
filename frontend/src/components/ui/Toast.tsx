import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number, action?: { label: string; onClick: () => void }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000, action?: { label: string; onClick: () => void }) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast: Toast = { id, message, type, duration, action }

        setToasts(prev => [...prev, newToast])

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
    }, [])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="size-5" />,
        error: <XCircle className="size-5" />,
        warning: <AlertCircle className="size-5" />,
        info: <Info className="size-5" />
    }

    const colors = {
        success: 'bg-green-500/10 border-green-500/20 text-green-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`${colors[toast.type]} backdrop-blur-xl border rounded-xl shadow-2xl p-4 pr-12 min-w-[300px] max-w-md pointer-events-auto relative`}
        >
            <div className="flex items-start gap-3">
                {icons[toast.type]}
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
                    {toast.action && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                toast.action?.onClick()
                                onClose()
                            }}
                            className="text-xs font-bold uppercase tracking-wider hover:underline"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
            </div>
            <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="size-4" />
            </button>
        </motion.div>
    )
}
