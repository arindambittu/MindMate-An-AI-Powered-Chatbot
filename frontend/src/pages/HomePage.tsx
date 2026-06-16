import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { ArrowRight, MessageSquare, Stars, Waves, Heart } from "lucide-react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { GlassCard } from "../components/ui/GlassCard"
import { useAuth } from "../context/AuthContext"
import moodIcon from "../assets/mood-3d.png"
import chatIcon from "../assets/chat-3d.png"
import stressIcon from "../assets/stress-3d.png"
import { Skeleton } from "../components/ui/Skeleton"
import { MoodChart } from "../components/ui/MoodChart"
import { ActivityChart } from "../components/ui/ActivityChart"

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

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

interface Conversation {
    id: number;
    title: string;
    created_at: string;
}

export default function HomePage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, token } = useAuth();

    useEffect(() => {
        const fetchConversations = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch('http://localhost:8000/api/conversations', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setConversations(data);
                }
            } catch (error) {
                console.error("Error fetching conversations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [token]);

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-12"
        >
            {/* Hero Section */}
            <motion.div variants={item} className="relative py-10">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-6">
                    <Stars className="size-3" />
                    <span>Personal AI Wellness Guide</span>
                </div>
                {user ? (
                    <>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 max-w-2xl leading-tight">
                            Welcome back, <br />
                            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">{user.username}.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-xl">
                            Ready to continue your wellness journey? Share your thoughts or check your latest insights.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 max-w-2xl leading-tight">
                            Your Mental Wellness, <br />
                            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Reimagined.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-xl mb-8">
                            MindMate uses advanced AI to help you understand your moods, manage stress, and find clarity every day.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/signup">
                                <Button size="lg" className="rounded-xl px-8 py-6 font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none">
                                    Get Started
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="rounded-xl px-8 py-6 font-bold text-lg border-white/10 hover:bg-white/5">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                <GlassCard gradient className="group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Waves className="size-4 text-primary" />
                                <span>Daily Mood</span>
                            </div>
                            <div className="text-3xl font-bold">Stable</div>
                            <p className="text-xs text-green-400 font-medium">+2% mood lift</p>
                        </div>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <motion.img
                                src={moodIcon}
                                alt="Mood"
                                className="size-24 object-contain group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            />
                        </motion.div>
                    </div>
                </GlassCard>

                <GlassCard gradient className="group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <MessageSquare className="size-4 text-purple-400" />
                                <span>Total Sessions</span>
                            </div>
                            <div className="text-3xl font-bold">
                                {isLoading ? (
                                    <Skeleton width={40} height={32} />
                                ) : (
                                    conversations.length
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Past 30 days</p>
                        </div>
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <motion.img
                                src={chatIcon}
                                alt="Chat"
                                className="size-24 object-contain group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            />
                        </motion.div>
                    </div>
                </GlassCard>

                <GlassCard gradient className="group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Heart className="size-4 text-pink-400" />
                                <span>Stress Level</span>
                            </div>
                            <div className="text-3xl font-bold">Low</div>
                            <p className="text-xs text-blue-400 font-medium">Optimal range</p>
                        </div>
                        <motion.div
                            animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <motion.img
                                src={stressIcon}
                                alt="Stress"
                                className="size-24 object-contain group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            />
                        </motion.div>
                    </div>
                </GlassCard>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-12">
                {/* Left Column: Analytics */}
                <div className="md:col-span-8 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Waves className="size-4 text-primary" />
                                Mood Trend
                            </h3>
                            <MoodChart data={mockMoodData} />
                        </GlassCard>
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <MessageSquare className="size-4 text-purple-400" />
                                Activity
                            </h3>
                            <ActivityChart data={mockActivityData} />
                        </GlassCard>
                    </div>

                    <GlassCard className="flex flex-col p-0 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">Recent Activity</h3>
                                <p className="text-sm text-muted-foreground">Your latest conversations and insights.</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs text-primary">View all</Button>
                        </div>
                        <div className="p-4 space-y-2">
                            {isLoading ? (
                                <div className="space-y-4 p-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex gap-4 items-center">
                                            <Skeleton circle width={48} height={48} />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton width="60%" height={16} />
                                                <Skeleton width="30%" height={12} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : conversations.length > 0 ? (
                                conversations.slice(0, 4).map((conv) => (
                                    <Link
                                        key={conv.id}
                                        to="/chat"
                                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group"
                                    >
                                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <MessageSquare className="size-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{conv.title}</p>
                                            <p className="text-sm text-muted-foreground">{getTimeAgo(conv.created_at)}</p>
                                        </div>
                                        <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center p-12 text-muted-foreground">
                                    <Heart className="size-12 mx-auto mb-4 opacity-20" />
                                    <p>No recent activity found.</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: CTA and Insights */}
                <div className="md:col-span-4 space-y-6">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-primary to-purple-700 text-white flex flex-col justify-between overflow-hidden">
                            <div className="absolute -top-10 -right-10 size-40 bg-white/10 blur-2xl rounded-full" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Ready to talk?</h3>
                                <p className="text-blue-100/80 mb-8">Start a new session to share your thoughts and feel better instantly.</p>
                            </div>
                            <Link to="/chat" className="relative z-10">
                                <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold py-6 text-lg rounded-xl shadow-xl">
                                    Start Session
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    <GlassCard className="p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Stars className="size-4 text-yellow-500" />
                            Daily Insight
                        </h3>
                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                            "Taking just five minutes to breathe deeply can significantly lower your cortisol levels. You're doing great today."
                        </p>
                    </GlassCard>
                </div>
            </div>
        </motion.div>
    )
}


