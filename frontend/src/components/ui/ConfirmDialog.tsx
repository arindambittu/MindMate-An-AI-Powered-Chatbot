import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Info, X } from "lucide-react"
import { Button } from "./button"

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    loading?: boolean
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'warning',
    loading = false
}: ConfirmDialogProps) {
    const icons = {
        danger: <AlertTriangle className="size-6 text-red-400" />,
        warning: <AlertTriangle className="size-6 text-yellow-400" />,
        info: <Info className="size-6 text-blue-400" />
    }

    const colors = {
        danger: 'from-red-500/20 to-red-600/10 border-red-500/20',
        warning: 'from-yellow-500/20 to-orange-600/10 border-yellow-500/20',
        info: 'from-blue-500/20 to-indigo-600/10 border-blue-500/20'
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`bg-gradient-to-br ${colors[variant]} backdrop-blur-xl border rounded-2xl shadow-2xl max-w-md w-full p-6`}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="shrink-0 p-2 rounded-xl bg-white/5">
                                    {icons[variant]}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
                                    <p className="text-sm text-white/70 leading-relaxed">{description}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="size-5 text-white/50" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="flex-1 rounded-xl border-white/10 hover:bg-white/5"
                                    disabled={loading}
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    className={`flex-1 rounded-xl font-bold ${variant === 'danger'
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : variant === 'warning'
                                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                                : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                    disabled={loading}
                                >
                                    {loading ? "Processing..." : confirmText}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
