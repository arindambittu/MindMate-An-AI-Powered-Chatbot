import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "../components/ui/GlassCard"
import { Waves, Wind, Heart, Sparkles, Cloud } from "lucide-react"
import { BreathingExercise } from "../components/BreathingExercise"

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

export default function CalmCorner() {
    const [selectedExercise, setSelectedExercise] = useState<"box" | "478" | "equal" | null>(null)

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-12 pb-20"
        >
            {/* Header Section */}
            <motion.div variants={item} className="relative py-10 text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 blur-[120px] rounded-full -z-10" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-6">
                    <Cloud className="size-3" />
                    <span>Your Sanctuary of Silence</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
                    The <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Calm Corner</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Take a moment for yourself. Choose a guided exercise below to find your inner balance.
                </p>
            </motion.div>

            <AnimatePresence mode="wait">
                {!selectedExercise ? (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid gap-6 md:grid-cols-3"
                    >
                        <GlassCard
                            gradient
                            className="p-8 cursor-pointer group hover:bg-white/10 transition-all border-white/5 active:scale-95"
                            onClick={() => setSelectedExercise("box")}
                        >
                            <div className="size-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
                                <Wind className="size-8 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Box Breathing</h3>
                            <p className="text-muted-foreground mb-6">
                                A powerful technique to regain control of your emotions and focus. Used by professionals in high-stress situations.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                                <span>Try now</span>
                                <Sparkles className="size-4" />
                            </div>
                        </GlassCard>

                        <GlassCard
                            gradient
                            className="p-8 cursor-pointer group hover:bg-white/10 transition-all border-white/5 active:scale-95"
                            onClick={() => setSelectedExercise("478")}
                        >
                            <div className="size-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500/30 transition-colors">
                                <Waves className="size-8 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">4-7-8 Breathing</h3>
                            <p className="text-muted-foreground mb-6">
                                Nature's natural tranquilizer for the nervous system. Perfect for lowering anxiety and falling asleep.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                                <span>Try now</span>
                                <Heart className="size-4" />
                            </div>
                        </GlassCard>

                        <GlassCard
                            gradient
                            className="p-8 cursor-pointer group hover:bg-white/10 transition-all border-white/5 active:scale-95"
                            onClick={() => setSelectedExercise("equal")}
                        >
                            <div className="size-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                                <Sparkles className="size-8 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Equal Breathing</h3>
                            <p className="text-muted-foreground mb-6">
                                Balance your energy and steady your mind. A simple yet effective way to harmonize your body's natural rhythm.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                                <span>Try now</span>
                                <Sparkles className="size-4" />
                            </div>
                        </GlassCard>
                    </motion.div>
                ) : (
                    <motion.div
                        key="exercise"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <BreathingExercise
                            type={selectedExercise}
                            onBack={() => setSelectedExercise(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {!selectedExercise && (
                <motion.div variants={item} className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground italic">
                        "Small steps lead to big changes. Thank you for taking this time for yourself."
                    </p>
                </motion.div>
            )}
        </motion.div>
    )
}
