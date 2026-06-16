import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  gradient?: boolean
}

export function GlassCard({ children, className, gradient, ...props }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/20",
        gradient && "after:absolute after:inset-0 after:-z-10 after:bg-gradient-to-br after:from-primary/10 after:via-transparent after:to-purple-500/10",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
