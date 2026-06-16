import { useState } from "react"
import { useTheme } from "../components/ThemeProvider"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"
import {
    Moon, Sun, Waves, Sunset, Monitor, Bell,
    Download, Trash2, Sparkles, User, Mail, Volume2, ShieldCheck, Loader2, Zap
} from "lucide-react"
import { GlassCard } from "../components/ui/GlassCard"
import { motion } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../components/ui/Toast"
import { ConfirmDialog } from "../components/ui/ConfirmDialog"

import { useNavigate } from "react-router-dom"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const { user, isGuest, logout, token } = useAuth()
    const navigate = useNavigate()

    // Mock states for interactive toggles
    const [notifications, setNotifications] = useState(true)
    const [voiceOutput, setVoiceOutput] = useState(false)
    const [privacyMode, setPrivacyMode] = useState(false)
    const [aiStyle, setAiStyle] = useState('Empathetic')

    const [immediateResponse, setImmediateResponse] = useState(() => {
        return localStorage.getItem('mindmate_immediate_response') === 'true'
    })

    const handleImmediateResponseToggle = () => {
        const newValue = !immediateResponse
        setImmediateResponse(newValue)
        localStorage.setItem('mindmate_immediate_response', String(newValue))
        showToast(`Immediate responses ${newValue ? 'enabled' : 'disabled'}`, 'info')
    }
    const { showToast } = useToast()
    const [isExporting, setIsExporting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

    const handleExportData = async () => {
        setIsExporting(true)
        try {
            const response = await fetch('http://localhost:8000/api/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `mindmate-data-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                showToast('Data exported successfully', 'success')
            }
        } catch (error) {
            showToast('Failed to export data', 'error')
        } finally {
            setIsExporting(false)
        }
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            // Mock account deletion
            await new Promise(r => setTimeout(r, 2000))
            showToast('Account deletion is not fully implemented in this demo', 'warning')
            setDeleteConfirmOpen(false)
        } catch (error) {
            showToast('Failed to delete account', 'error')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme as any)
        showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme applied`, 'info', 2000)
    }

    const themeOptions = [
        { id: 'light', label: 'Light', icon: Sun, color: 'text-yellow-500' },
        { id: 'dark', label: 'Dark', icon: Moon, color: 'text-indigo-400' },
        { id: 'ocean', label: 'Ocean', icon: Waves, color: 'text-blue-400' },
        { id: 'sunset', label: 'Sunset', icon: Sunset, color: 'text-orange-400' },
    ]

    return (
        <div className="space-y-10 max-w-4xl pb-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-lg">Personalize your MindMate experience.</p>
            </motion.div>

            <div className="grid gap-8">
                {/* Account Section */}
                <GlassCard className="p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <User className="size-5 text-indigo-400" />
                        <h2 className="text-xl font-bold">Account Profile</h2>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="size-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1">
                            <div className="size-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                <User className="size-12 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className="grid gap-1">
                                <h3 className="text-2xl font-bold">{user?.username || (isGuest ? "Guest User" : "Anonymous")}</h3>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                                    <Mail className="size-4" />
                                    <span>{user?.email || "No email associated"}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <Button
                                    variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-white/5"
                                    onClick={() => navigate('/profile')}
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-white/5 text-red-400 hover:text-red-300"
                                    onClick={() => {
                                        logout()
                                        navigate('/login')
                                        showToast('Signed out successfully', 'info')
                                    }}
                                >
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Appearance Section */}
                <GlassCard className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Monitor className="size-5 text-primary" />
                        <h2 className="text-xl font-bold">Appearance</h2>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Choose Theme</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {themeOptions.map((opt) => {
                                const Icon = opt.icon
                                const isActive = theme === opt.id
                                return (
                                    <motion.div
                                        key={opt.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`cursor-pointer rounded-2xl p-6 flex flex-col items-center gap-3 transition-all border-2 ${isActive
                                            ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                        onClick={() => handleThemeChange(opt.id)}
                                    >
                                        <div className={`p-3 rounded-xl bg-white/5 ${opt.color}`}>
                                            <Icon className="size-6" />
                                        </div>
                                        <span className={`font-semibold ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                                            {opt.label}
                                        </span>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </GlassCard>

                {/* AI & Preferences Section */}
                <GlassCard className="p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <Sparkles className="size-5 text-purple-400" />
                        <h2 className="text-xl font-bold">AI & Experience</h2>
                    </div>

                    <div className="space-y-6">
                        <ToggleItem
                            icon={Volume2}
                            title="Voice Responses"
                            description="Enable AI text-to-speech for responses."
                            enabled={voiceOutput}
                            onToggle={() => {
                                setVoiceOutput(!voiceOutput)
                                showToast(`Voice responses ${!voiceOutput ? 'enabled' : 'disabled'}`, 'info')
                            }}
                        />
                        <ToggleItem
                            icon={Zap}
                            title="Immediate Responses"
                            description="AI sends a quick acknowledgment within a second while generating the full response."
                            enabled={immediateResponse}
                            onToggle={handleImmediateResponseToggle}
                        />
                        <ToggleItem
                            icon={ShieldCheck}
                            title="Incognito Mode"
                            description="Chat history won't be saved for this device."
                            enabled={privacyMode}
                            onToggle={() => {
                                setPrivacyMode(!privacyMode)
                                showToast(`Incognito mode ${!privacyMode ? 'enabled' : 'disabled'}`, 'warning')
                            }}
                        />
                        <ToggleItem
                            icon={Bell}
                            title="Notifications"
                            description="Receive wellness reminders and check-ins."
                            enabled={notifications}
                            onToggle={() => {
                                setNotifications(!notifications)
                                showToast(`Notifications ${!notifications ? 'enabled' : 'disabled'}`, 'info')
                            }}
                        />

                        <div className="pt-4 space-y-4 border-t border-white/5">
                            <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">AI Response Style</Label>
                            <div className="flex flex-wrap gap-3">
                                {['Empathetic', 'Clinical', 'Casual', 'Concise'].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => {
                                            setAiStyle(style)
                                            showToast(`AI style set to ${style}`, 'info')
                                        }}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${aiStyle === style
                                            ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50'
                                            : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Data & Security Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-4 text-primary">
                            <Download className="size-5" />
                            <h3 className="font-bold">Export Data</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Download all your conversation history and wellness data.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full rounded-xl border-white/10 hover:bg-white/5"
                            onClick={handleExportData}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            {isExporting ? 'Exporting...' : 'Generate Archive'}
                        </Button>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <Trash2 className="size-5" />
                            <h3 className="font-bold">Delete Account</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Permanently remove your account and all associated data.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full rounded-xl border-red-500/10 hover:bg-red-500/10 text-red-500 border-red-500/20"
                            onClick={() => setDeleteConfirmOpen(true)}
                        >
                            Delete Everything
                        </Button>
                    </GlassCard>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                description="Are you absolutely sure you want to delete your account? This action is permanent and will delete all your conversations, moods, and profile data."
                confirmText={isDeleting ? "Deleting..." : "Permanently Delete"}
                cancelText="Keep My Account"
                variant="danger"
            />
        </div>
    )
}

function ToggleItem({ icon: Icon, title, description, enabled, onToggle }: any) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon className="size-5 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`relative w-12 h-6 rounded-full p-1 transition-colors duration-300 ${enabled ? 'bg-indigo-500' : 'bg-zinc-800'}`}
            >
                <div className={`size-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    )
}
