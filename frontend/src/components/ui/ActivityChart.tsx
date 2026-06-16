import { motion } from "framer-motion"

interface ActivityChartProps {
    data: Array<{
        day: string
        count: number
    }>
}

export function ActivityChart({ data }: ActivityChartProps) {
    const maxCount = Math.max(...data.map(d => d.count), 1)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weekly Activity</span>
                <span className="text-xs text-muted-foreground">
                    {data.reduce((sum, d) => sum + d.count, 0)} total
                </span>
            </div>

            <div className="flex items-end justify-between gap-2 h-32">
                {data.map((item, index) => {
                    const height = (item.count / maxCount) * 100

                    return (
                        <motion.div
                            key={index}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                            className="flex-1 flex flex-col items-center gap-2"
                        >
                            <motion.div
                                whileHover={{ scale: 1.1, y: -4 }}
                                className="w-full bg-gradient-to-t from-indigo-500/80 to-purple-500/80 rounded-t-lg relative group cursor-pointer"
                                style={{ minHeight: height > 0 ? '20%' : '4px' }}
                            >
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-2 py-1 text-xs font-bold text-white whitespace-nowrap">
                                        {item.count} {item.count === 1 ? 'chat' : 'chats'}
                                    </div>
                                </div>
                            </motion.div>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                {item.day}
                            </span>
                        </motion.div>
                    )
                })}
            </div>

            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-t border-white/20" />
                <div className="border-t border-white/20" />
                <div className="border-t border-white/20" />
            </div>
        </div>
    )
}
