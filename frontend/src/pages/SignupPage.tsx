import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { GlassCard } from "../components/ui/GlassCard"
import { Sparkles, ChevronRight, Mail, User, Check } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function SignupPage() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const { continueAsGuest } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // Client-side validation
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
            setError("Username must be 3-20 characters (letters, numbers, underscore, or dash only)")
            return
        }

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailPattern.test(email)) {
            setError("Please enter a valid email address")
            return
        }

        setLoading(true)

        try {
            const res = await fetch("http://localhost:8000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess(true)
                setTimeout(() => navigate("/login"), 2000)
            } else {
                setError(data.message || "Registration failed")
            }
        } catch (err) {
            setError("Failed to connect to server")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-black overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <motion.div
                        className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl mb-4"
                        whileHover={{ scale: 1.05 }}
                    >
                        <Sparkles className="size-8 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Join MindMate</h1>
                    <p className="text-slate-400 mt-2">Start your emotional wellness journey</p>
                </div>

                <GlassCard className="p-8">
                    {success ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-8 space-y-4"
                        >
                            <div className="size-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                                <Check className="size-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Account Created!</h3>
                            <p className="text-slate-400">Redirecting to login...</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="username" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoComplete="username"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                        placeholder="yourname"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-500 ml-1">3-20 characters, letters, numbers, underscore or dash</p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {loading ? "Creating Account..." : "Sign Up"}
                                {!loading && <ChevronRight className="size-4" />}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 space-y-4 pt-8 border-t border-white/5 text-center">
                        <button
                            onClick={() => {
                                continueAsGuest()
                                navigate("/chat")
                            }}
                            className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                        >
                            Continue as Guest
                        </button>

                        <p className="text-slate-400 text-sm font-medium">
                            Already have an account?{" "}
                            <Link to="/login" className="text-white hover:underline">Sign In</Link>
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
