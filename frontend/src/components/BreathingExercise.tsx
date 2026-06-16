import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { GlassCard } from "./ui/GlassCard"
import { Play, Pause, RotateCcw, ChevronLeft } from "lucide-react"

interface BreathingExerciseProps {
    type: "box" | "478" | "equal";
    onBack: () => void;
}

const exercises = {
    box: {
        name: "Box Breathing",
        description: "Inhale, hold, exhale, hold. Each for 4 seconds.",
        steps: [
            { label: "Inhale", duration: 4 },
            { label: "Hold", duration: 4 },
            { label: "Exhale", duration: 4 },
            { label: "Hold", duration: 4 },
        ]
    },
    "478": {
        name: "4-7-8 Breathing",
        description: "Inhale for 4, hold for 7, exhale for 8.",
        steps: [
            { label: "Inhale", duration: 4 },
            { label: "Hold", duration: 7 },
            { label: "Exhale", duration: 8 },
        ]
    },
    equal: {
        name: "Equal Breathing",
        description: "Inhale and exhale for equal counts of 4 seconds.",
        steps: [
            { label: "Inhale", duration: 4 },
            { label: "Exhale", duration: 4 },
        ]
    }
}

export const BreathingExercise = ({ type, onBack }: BreathingExerciseProps) => {
    const exercise = exercises[type]
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [timeLeft, setTimeLeft] = useState(exercise.steps[0].duration)

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (isActive && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
        } else if (isActive && timeLeft === 0) {
            const nextStep = (currentStep + 1) % exercise.steps.length
            setCurrentStep(nextStep)
            setTimeLeft(exercise.steps[nextStep].duration)
        }
        return () => clearTimeout(timer)
    }, [isActive, timeLeft, currentStep, exercise.steps])

    const reset = () => {
        setIsActive(false)
        setCurrentStep(0)
        setTimeLeft(exercise.steps[0].duration)
    }

    const currentStepData = exercise.steps[currentStep]

    return (
        <div className="space-y-8 max-w-lg mx-auto text-center">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full">
                    <ChevronLeft className="size-4 mr-1" /> Back
                </Button>
                <h2 className="text-2xl font-bold">{exercise.name}</h2>
            </div>

            <GlassCard className="p-12 relative overflow-hidden aspect-square flex flex-col items-center justify-center">
                {/* Breathing Animation */}
                <motion.div
                    animate={{
                        scale: isActive 
                            ? (currentStepData.label === "Inhale" ? 1.5 : currentStepData.label === "Exhale" ? 0.8 : 1.2)
                            : 1,
                        opacity: isActive ? 0.6 : 0.3
                    }}
                    transition={{
                        duration: currentStepData.duration,
                        ease: "easeInOut"
                    }}
                    className="absolute size-48 bg-primary rounded-full blur-3xl -z-10"
                />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <span className="text-4xl font-black tracking-widest uppercase text-primary">
                            {currentStepData.label}
                        </span>
                        <div className="text-6xl font-bold tabular-nums">
                            {timeLeft}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Visual Circle Indicator */}
                <div className="mt-12 size-64 rounded-full border-2 border-white/5 flex items-center justify-center p-4 relative">
                    <motion.div
                        animate={{
                            scale: isActive 
                                ? (currentStepData.label === "Inhale" ? 1.2 : currentStepData.label === "Exhale" ? 0.5 : 0.8)
                                : 0.8,
                            opacity: isActive ? 1 : 0.5
                        }}
                        transition={{
                            duration: currentStepData.duration,
                            ease: "easeInOut"
                        }}
                        className={`size-full rounded-full bg-gradient-to-tr from-primary to-purple-500 shadow-2xl shadow-primary/20`}
                    />
                </div>
            </GlassCard>

            <div className="flex justify-center gap-4">
                <Button 
                    size="lg" 
                    onClick={() => setIsActive(!isActive)}
                    className="rounded-xl px-8 h-12 font-bold min-w-[140px]"
                >
                    {isActive ? (
                        <>
                            <Pause className="size-5 mr-2" /> Pause
                        </>
                    ) : (
                        <>
                            <Play className="size-5 mr-2" /> {currentStep === 0 && timeLeft === exercise.steps[0].duration ? "Start" : "Resume"}
                        </>
                    )}
                </Button>
                <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={reset}
                    className="rounded-xl px-8 h-12 font-bold"
                >
                    <RotateCcw className="size-5 mr-2" /> Reset
                </Button>
            </div>

            <p className="text-muted-foreground italic">
                {exercise.description}
            </p>
        </div>
    )
}
