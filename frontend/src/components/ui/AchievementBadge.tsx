import { motion } from "framer-motion"
import { Trophy, Zap, Target, Heart, MessageCircle, Calendar, Award } from "lucide-react"

interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    unlocked: boolean
    unlockedAt?: string
}

interface AchievementBadgeProps {
    achievement: Achievement
}

const iconMap: { [key: string]: any } = {
    trophy: Trophy,
    zap: Zap,
    target: Target,
    heart: Heart,
    message: MessageCircle,
    calendar: Calendar,
    award: Award
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
    const Icon = iconMap[achievement.icon] || Trophy

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            className={`relative p-4 rounded-2xl border transition-all ${achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border-yellow-500/20'
                    : 'bg-white/5 border-white/5 grayscale opacity-50'
                }`}
        >
            {/* Badge Icon */}
            <div className={`size-12 rounded-xl flex items-center justify-center mb-3 ${achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/20'
                    : 'bg-white/5'
                }`}>
                <Icon className={`size-6 ${achievement.unlocked ? 'text-white' : 'text-white/30'}`} />
            </div>

            {/* Badge Info */}
            <h3 className={`font-bold mb-1 ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>
                {achievement.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {achievement.description}
            </p>

            {/* Unlock Date */}
            {achievement.unlocked && achievement.unlockedAt && (
                <p className="text-[10px] text-yellow-400 font-medium mt-2">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
            )}

            {/* Sparkle effect for unlocked badges */}
            {achievement.unlocked && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2"
                >
                    <div className="size-6 rounded-full bg-yellow-500 flex items-center justify-center">
                        <Zap className="size-3 text-white fill-white" />
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map(achievement => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
        </div>
    )
}
