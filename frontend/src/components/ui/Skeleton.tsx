import { motion } from "framer-motion"

interface SkeletonProps {
    className?: string
    width?: string | number
    height?: string | number
    circle?: boolean
}

export function Skeleton({ className = "", width, height, circle }: SkeletonProps) {
    return (
        <motion.div
            animate={{
                opacity: [0.5, 1, 0.5],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            className={`bg-white/5 rounded-lg ${className}`}
            style={{
                width: width || '100%',
                height: height || '1rem',
                borderRadius: circle ? '50%' : undefined
            }}
        />
    )
}

export function ChatSkeleton() {
    return (
        <div className="space-y-4 p-4">
            <div className="flex gap-3">
                <Skeleton circle width={40} height={40} />
                <div className="space-y-2 flex-1">
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
            <div className="flex gap-3 justify-end">
                <div className="space-y-2 flex-1 flex flex-col items-end">
                    <Skeleton width="50%" height={16} />
                    <Skeleton width="30%" height={12} />
                </div>
                <Skeleton circle width={40} height={40} />
            </div>
            <Skeleton width="80%" height={16} />
        </div>
    )
}
