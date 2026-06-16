import { motion } from "framer-motion"
import { Smile, Meh, Frown } from "lucide-react"

interface MoodChartProps {
    data: Array<{
        date: string
        mood: 'positive' | 'neutral' | 'negative'
    }>
}

export function MoodChart({ data }: MoodChartProps) {
    const moodColors = {
        positive: 'bg-green-500',
        neutral: 'bg-yellow-500',
        negative: 'bg-red-500'
    }

    const moodIcons = {
        positive: <Smile className="size-4" />,
        neutral: <Meh className="size-4" />,
        negative: <Frown className="size-4" />
    }

    // Get last 7 days
    const recentData = data.slice(-7)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last 7 days</span>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Positive</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-yellow-500" />
                        <span className="text-muted-foreground">Neutral</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Negative</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-2 h-32">
                {recentData.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="flex-1 flex flex-col items-center gap-2"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`${moodColors[item.mood]} w-full rounded-t-lg flex items-center justify-center text-white relative group cursor-pointer`}
                            style={{ minHeight: '60%' }}
                        >
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                {moodIcons[item.mood]}
                            </div>
                        </motion.div>
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
