import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "../components/ui/GlassCard"
import { User, Mail, Calendar, Edit2, Check, X, Loader2, Trophy, Award } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { MoodChart } from "../components/ui/MoodChart"
import { ActivityChart } from "../components/ui/ActivityChart"
import { AchievementGrid } from "../components/ui/AchievementBadge"

const mockAchievements: any[] = [
    { id: '1', title: 'Early Bird', description: 'Joined MindMate in its early days.', icon: 'award', unlocked: true, unlockedAt: '2024-01-15' },
    { id: '2', title: 'Chatty Cathy', description: 'Sent over 100 messages.', icon: 'message', unlocked: true, unlockedAt: '2024-02-10' },
    { id: '3', title: 'Mindful Master', description: 'Reached a 7-day streak.', icon: 'zap', unlocked: false },
    { id: '4', title: 'Deep Diver', description: 'Had a conversation longer than 30 minutes.', icon: 'target', unlocked: true, unlockedAt: '2024-03-01' },
];

const mockMoodData: any = [
    { date: '2024-03-10', mood: 'positive' },
    { date: '2024-03-11', mood: 'positive' },
    { date: '2024-03-12', mood: 'neutral' },
    { date: '2024-03-13', mood: 'positive' },
    { date: '2024-03-14', mood: 'neutral' },
    { date: '2024-03-15', mood: 'positive' },
    { date: '2024-03-16', mood: 'positive' },
];

const mockActivityData = [
    { day: 'Mon', count: 3 },
    { day: 'Tue', count: 5 },
    { day: 'Wed', count: 2 },
    { day: 'Thu', count: 8 },
    { day: 'Fri', count: 4 },
    { day: 'Sat', count: 12 },
    { day: 'Sun', count: 6 },
];
export default function ProfilePage() {
    const { user, token, login } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [bio, setBio] = useState("")
    const [journey, setJourney] = useState("")
    const [location, setLocation] = useState("")
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState({ active_days: 0, conversations: 0, user_messages: 0 })
    const [statsLoading, setStatsLoading] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Load user profile data and stats on mount
    useEffect(() => {
        if (user) {
            setBio(user.bio || "")
            setJourney(user.journey || "")
            setLocation(user.location || "")
        }
        fetchStats()
    }, [user])

    const fetchStats = async () => {
        setStatsLoading(true)
        try {
            const response = await fetch('http://localhost:8000/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
        } finally {
            setStatsLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        setLoading(true)
        setMessage(null)
        try {
            const response = await fetch('http://localhost:8000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bio, journey, location })
            })
            const data = await response.json()

            if (response.ok) {
                // Update the user in auth context
                login(token!, data.user)
                setMessage({ type: 'success', text: 'Profile updated successfully!' })
                setIsEditing(false)
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to connect to server' })
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setBio(user?.bio || "")
        setJourney(user?.journey || "")
        setLocation(user?.location || "")
        setIsEditing(false)
        setMessage(null)
    }

    const statCards = [
        { label: "Active Days", value: stats.active_days.toString() },
        { label: "Conversations", value: stats.conversations.toString() },
        { label: "Messages Sent", value: stats.user_messages.toString() },
    ]

    return (
        <div className="space-y-10 max-w-5xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-64 rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-600 shadow-2xl"
            >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-0 left-0 p-10 flex items-center gap-8 translate-y-1/2 w-full">
                    <div className="size-32 rounded-3xl bg-background p-2 border border-white/10 shadow-2xl">
                        <div className="size-full rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center">
                            <User className="size-16 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 pb-4">
                        <h1 className="text-4xl font-bold text-white drop-shadow-lg">{user?.username || "Guest"}</h1>
                        <p className="text-white/80 font-medium">MindMate Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                    </div>
                    {!isEditing ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditing(true)}
                            className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-white/20 transition-all self-end mb-4"
                        >
                            <Edit2 className="size-4" />
                            Edit Profile
                        </motion.button>
                    ) : (
                        <div className="flex gap-2 self-end mb-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="bg-green-500/90 backdrop-blur-md border border-green-400/20 px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-green-500 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                                Save
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancel}
                                disabled={loading}
                                className="bg-red-500/90 backdrop-blur-md border border-red-400/20 px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-red-500 transition-all disabled:opacity-50"
                            >
                                <X className="size-4" />
                                Cancel
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Success/Error Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl border text-center font-medium ${message.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pt-20 grid gap-8 md:grid-cols-12">
                <div className="md:col-span-4 space-y-6">
                    <GlassCard className="p-6">
                        <h2 className="text-xl font-bold mb-6">About Me</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="size-4 shrink-0" />
                                <span className="text-sm break-all">{user?.email || "No email provided"}</span>
                            </div>

                            {isEditing ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g., San Francisco, CA"
                                        maxLength={100}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            ) : (
                                user?.location && (
                                    <div className="flex items-start gap-3 text-muted-foreground">
                                        <Calendar className="size-4 shrink-0 mt-0.5" />
                                        <span className="text-sm">{user.location}</span>
                                    </div>
                                )
                            )}

                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Calendar className="size-4 shrink-0" />
                                <span className="text-sm">Joined {new Date(user?.created_at || '').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid grid-cols-2 gap-4">
                        {statCards.map((stat) => (
                            <GlassCard key={stat.label} className="p-4 flex flex-col items-center justify-center text-center">
                                {statsLoading ? (
                                    <Loader2 className="size-6 animate-spin text-primary" />
                                ) : (
                                    <>
                                        <span className="text-2xl font-bold text-primary">{stat.value}</span>
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                                    </>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-8 space-y-6">
                    <GlassCard className="p-8">
                        <h2 className="text-2xl font-bold mb-6">Bio</h2>
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    maxLength={500}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                />
                                <p className="text-xs text-slate-500 text-right">{bio.length}/500</p>
                            </div>
                        ) : (
                            <div className="text-muted-foreground leading-relaxed">
                                {user?.bio || (
                                    <p className="text-sm italic text-slate-500">
                                        No bio added yet. Click "Edit Profile" to add one.
                                    </p>
                                )}
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard className="p-8">
                        <h2 className="text-2xl font-bold mb-6">Insights & Analytics</h2>
                        <div className="grid gap-6 md:grid-cols-2 mb-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Mood Trends</h3>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <MoodChart data={mockMoodData} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Weekly Activity</h3>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <ActivityChart data={mockActivityData} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Trophy className="size-5 text-yellow-500" />
                                Achievements
                            </h3>
                            <AchievementGrid achievements={mockAchievements} />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8">
                        <h2 className="text-2xl font-bold mb-6">About My Journey</h2>
                        <div className="space-y-4">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={journey}
                                        onChange={(e) => setJourney(e.target.value)}
                                        placeholder="Describe your mental health journey..."
                                        maxLength={1000}
                                        rows={8}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                    />
                                    <p className="text-xs text-slate-500 text-right">{journey.length}/1000</p>
                                </div>
                            ) : journey ? (
                                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {journey}
                                </div>
                            ) : stats.conversations > 0 ? (
                                <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Award className="size-6 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-lg">Consistency is Key</h4>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Over the past month, you've engaged in **{stats.conversations} conversations** and shared **{stats.user_messages} thoughts**.
                                            Your dedication to mindful reflection for **{stats.active_days} days** is showing real progress in your emotional awareness.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                                    <div className="space-y-1">
                                        <h3 className="font-bold">Start Your Journey</h3>
                                        <p className="text-sm text-muted-foreground">Begin chatting with MindMate to see your activity here.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
