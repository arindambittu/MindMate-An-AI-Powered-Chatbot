import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { 
    Gamepad2, 
    ArrowLeft, 
    Sparkles, 
    RotateCcw, 
    Trophy, 
    User, 
    Cpu, 
    Circle,
    Play,
    Volume2,
    VolumeX,
    Camera
} from "lucide-react"
import Webcam from "react-webcam"
import { motion, AnimatePresence } from "framer-motion"
import { Hands, Results, HAND_CONNECTIONS } from "@mediapipe/hands"
import * as drawingUtils from "@mediapipe/drawing_utils"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { GlassCard } from "../components/ui/GlassCard"
import { useToast } from "../components/ui/Toast"

// ============================================================================
// GAME TYPES & CONSTANTS
// ============================================================================
type GameMode = "menu" | "bubble_popper" | "tic_tac_toe"

interface Bubble {
    id: number;
    x: number; // 0 to 1 normalized
    y: number; // 0 to 1 normalized
    radius: number; // normalized radius (e.g., 0.05)
    speedY: number; // velocity upward
    speedX: number; // drift sideways
    color: string;
}

type TTTCell = "X" | "O" | null
type TTTPlayMode = "vs_ai" | "vs_player"

interface TTTState {
    board: TTTCell[];
    currentPlayer: "X" | "O";
    winner: TTTCell | "draw";
    status: "idle" | "playing" | "game_over";
    resultMessage: string;
    playMode: TTTPlayMode;
    playerSymbol: "X" | "O";
}

const COLOR_PALETTE = [
    "rgba(99, 102, 241, 0.7)",  // Indigo
    "rgba(168, 85, 247, 0.7)",  // Purple
    "rgba(236, 72, 153, 0.7)",  // Pink
    "rgba(59, 130, 246, 0.7)",  // Blue
    "rgba(16, 185, 129, 0.7)"   // Green
]

// ============================================================================
// SOUND SYNTHESIS UTILITY (Web Audio API)
// ============================================================================
const playSound = (type: "pop" | "countdown" | "shoot" | "win" | "lose" | "draw") => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return
        
        const ctx = new AudioContextClass()
        const masterGain = ctx.createGain()
        masterGain.connect(ctx.destination)

        if (type === "pop") {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            
            osc.type = "sine"
            osc.frequency.setValueAtTime(400, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1)
            
            gain.gain.setValueAtTime(0.25, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
            
            osc.connect(gain)
            gain.connect(masterGain)
            osc.start()
            osc.stop(ctx.currentTime + 0.12)
        } else if (type === "countdown") {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            
            osc.type = "triangle"
            osc.frequency.setValueAtTime(600, ctx.currentTime)
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
            
            osc.connect(gain)
            gain.connect(masterGain)
            osc.start()
            osc.stop(ctx.currentTime + 0.1)
        } else if (type === "shoot") {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            
            osc.type = "sawtooth"
            osc.frequency.setValueAtTime(800, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2)
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
            
            osc.connect(gain)
            gain.connect(masterGain)
            osc.start()
            osc.stop(ctx.currentTime + 0.22)
        } else if (type === "win") {
            const now = ctx.currentTime
            const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = "sine"
                osc.frequency.value = freq
                
                gain.gain.setValueAtTime(0.15, now + idx * 0.08)
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.15)
                
                osc.connect(gain)
                gain.connect(masterGain)
                osc.start(now + idx * 0.08)
                osc.stop(now + idx * 0.08 + 0.18)
            })
        } else if (type === "lose") {
            const now = ctx.currentTime
            const notes = [392.00, 349.23, 311.13, 261.63] // G4, F4, Eb4, C4
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = "triangle"
                osc.frequency.value = freq
                
                gain.gain.setValueAtTime(0.15, now + idx * 0.12)
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2)
                
                osc.connect(gain)
                gain.connect(masterGain)
                osc.start(now + idx * 0.12)
                osc.stop(now + idx * 0.12 + 0.22)
            })
        } else if (type === "draw") {
            const now = ctx.currentTime
            const notes = [440.00, 440.00] // A4
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = "sine"
                osc.frequency.value = freq
                
                gain.gain.setValueAtTime(0.15, now + idx * 0.1)
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.1)
                
                osc.connect(gain)
                gain.connect(masterGain)
                osc.start(now + idx * 0.1)
                osc.stop(now + idx * 0.1 + 0.12)
            })
        }
    } catch (e) {
        console.error("Web Audio API not supported or blocked:", e)
    }
}

// Deleted classifyGestureLocally and calculateDistance since they are replaced by Tic Tac Toe logic.

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function GestureGame() {
    const [activeMode, setActiveMode] = useState<GameMode>("menu")
    const [isMuted, setIsMuted] = useState(false)
    const { showToast } = useToast()
    const navigate = useNavigate()

    // Camera and canvas refs
    const webcamRef = useRef<Webcam>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    
    // MediaPipe state
    const handsRef = useRef<Hands | null>(null)
    const isActiveRef = useRef<boolean>(false)
    const [cameraReady, setCameraReady] = useState(false)

    // Joint landmark color settings
    const handLinesColor = "#00bfff" // Cyan lines
    const jointColor = "#ffffff"     // White joints

    // Shared tracking variables
    const latestFingerTipRef = useRef<{ x: number; y: number } | null>(null)
    const latestLandmarksRef = useRef<any[] | null>(null)

    // ==========================================
    // BUBBLE POPPER STATE & GAME LOOP
    // ==========================================
    const [bubbleScore, setBubbleScore] = useState(0)
    const [bubbleHighScore, setBubbleHighScore] = useState(() => {
        return Number(localStorage.getItem("mindmate_bubble_highscore") || "0")
    })
    const bubblesRef = useRef<Bubble[]>([])
    const nextBubbleId = useRef(0)
    const gameTimerRef = useRef<number | null>(null)

    // ==========================================
    // TIC TAC TOE STATE & HOVER REF
    // ==========================================
    const [tttScore, setTttScore] = useState({ x: 0, o: 0 })
    const [tttGame, setTttGame] = useState<TTTState>({
        board: Array(9).fill(null),
        currentPlayer: "X",
        winner: null,
        status: "idle",
        resultMessage: "Select mode to start playing!",
        playMode: "vs_ai",
        playerSymbol: "X"
    })

    const tttGameRef = useRef<TTTState>(tttGame)
    const tttHoverCellRef = useRef<number | null>(null)
    const tttHoverStartRef = useRef<number | null>(null)
    const tttHoverProgressRef = useRef<number>(0)

    // Keep tttGameRef updated
    useEffect(() => {
        tttGameRef.current = tttGame
    }, [tttGame])

    // Sound toggle helper
    const triggerSound = (type: "pop" | "countdown" | "shoot" | "win" | "lose" | "draw") => {
        if (!isMuted) playSound(type)
    }

    // Initialize/clean up MediaPipe
    useEffect(() => {
        isActiveRef.current = activeMode !== "menu"
        setCameraReady(false)

        if (activeMode === "menu") {
            if (handsRef.current) {
                try {
                    handsRef.current.close()
                } catch (e) {
                    console.error("Error cleaning up MediaPipe:", e)
                }
                handsRef.current = null
            }
            return
        }

        // Initialize MediaPipe Hands
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        hands.setOptions({
            maxNumHands: 1, // Only need 1 hand for these games
            modelComplexity: 0, // Lite model for high FPS / low latency
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        })

        hands.onResults(onResults)
        handsRef.current = hands

        return () => {
            isActiveRef.current = false
            if (handsRef.current) {
                try {
                    handsRef.current.close()
                } catch (e) {
                    // Ignore errors during clean up
                }
                handsRef.current = null
            }
        }
    }, [activeMode])

    // ==========================================
    // MEDIAPIPE FRAME HANDLER
    // ==========================================
    const onResults = (results: Results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0]
            latestLandmarksRef.current = landmarks
            latestFingerTipRef.current = landmarks[8]
        } else {
            latestLandmarksRef.current = null
            latestFingerTipRef.current = null
        }
    }

    // MediaPipe processing loop
    useEffect(() => {
        if (activeMode === "menu" || !cameraReady) return

        let active = true
        let animationFrameId: number

        let lastProcessedTime = 0
        const processVideo = async () => {
            if (!active) return

            const now = Date.now()
            if (videoRef.current && videoRef.current.readyState >= 2 && handsRef.current) {
                // Throttle processing to ~30 FPS to avoid redundant processing of duplicate webcam frames
                if (now - lastProcessedTime >= 33) {
                    lastProcessedTime = now
                    try {
                        await handsRef.current.send({ image: videoRef.current })
                    } catch (e: any) {
                        if (!e?.message?.includes("already deleted")) {
                            console.error("Hands detection error in game:", e)
                        }
                    }
                }
            }

            if (active && activeMode !== "menu") {
                // If video is ready, request next frame immediately, otherwise wait to prevent spin loop
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    animationFrameId = requestAnimationFrame(processVideo)
                } else {
                    setTimeout(() => {
                        if (active) {
                            animationFrameId = requestAnimationFrame(processVideo)
                        }
                    }, 100)
                }
            }
        }

        animationFrameId = requestAnimationFrame(processVideo)

        return () => {
            active = false
            cancelAnimationFrame(animationFrameId)
        }
    }, [activeMode, cameraReady])

    // Decoupled 60 FPS Game Loop
    useEffect(() => {
        if (activeMode === "menu") return

        let animationFrameId: number
        let active = true

        const loop = () => {
            if (!active) return

            if (canvasRef.current && videoRef.current) {
                const video = videoRef.current
                const canvas = canvasRef.current
                const canvasCtx = canvas.getContext("2d")

                if (canvasCtx && video.readyState >= 2) {
                    // Match resolution
                    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight
                    }

                    canvasCtx.save()
                    canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

                    // Mirror horizontal canvas to match webcam mirroring
                    canvasCtx.translate(canvas.width, 0)
                    canvasCtx.scale(-1, 1)

                    // Draw skeleton landmarks in mirrored space
                    const landmarks = latestLandmarksRef.current
                    if (landmarks) {
                        drawingUtils.drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: handLinesColor, lineWidth: 3 })
                        drawingUtils.drawLandmarks(canvasCtx, landmarks, { color: jointColor, lineWidth: 2, radius: 4 })
                    }

                    // Hover detection for Tic Tac Toe
                    let hoveredCell: number | null = null
                    const finger = latestFingerTipRef.current
                    if (finger && tttGameRef.current.status === "playing") {
                        if (finger.x >= 0.2 && finger.x <= 0.8 && finger.y >= 0.15 && finger.y <= 0.75) {
                            const col = Math.floor((finger.x - 0.2) / 0.2)
                            const row = Math.floor((finger.y - 0.15) / 0.2)
                            const cellIdx = row * 3 + col
                            
                            // Only hover empty cells
                            if (tttGameRef.current.board[cellIdx] === null) {
                                hoveredCell = cellIdx
                            }
                        }
                    }

                    if (hoveredCell !== null) {
                        if (tttHoverCellRef.current === hoveredCell) {
                            if (tttHoverStartRef.current === null) {
                                tttHoverStartRef.current = Date.now()
                            }
                            const elapsed = Date.now() - tttHoverStartRef.current
                            const progress = Math.min(1.0, elapsed / 1200)
                            tttHoverProgressRef.current = progress

                            if (progress >= 1.0) {
                                handleTTTCellPlay(hoveredCell, tttGameRef.current.currentPlayer)
                                tttHoverCellRef.current = null
                                tttHoverStartRef.current = null
                                tttHoverProgressRef.current = 0
                            }
                        } else {
                            tttHoverCellRef.current = hoveredCell
                            tttHoverStartRef.current = Date.now()
                            tttHoverProgressRef.current = 0
                        }
                    } else {
                        tttHoverCellRef.current = null
                        tttHoverStartRef.current = null
                        tttHoverProgressRef.current = 0
                    }

                    // Render game elements depending on active game
                    if (activeMode === "bubble_popper") {
                        updateAndRenderBubbles(canvasCtx, latestFingerTipRef.current)
                    } else if (activeMode === "tic_tac_toe") {
                        renderTTTGuide(canvasCtx)

                        // Draw circular progress indicator
                        if (tttHoverCellRef.current !== null && tttHoverProgressRef.current > 0) {
                            const idx = tttHoverCellRef.current
                            const row = Math.floor(idx / 3)
                            const col = idx % 3
                            
                            const xStart = canvas.width * 0.2
                            const yStart = canvas.height * 0.15
                            const xStep = canvas.width * 0.2
                            const yStep = canvas.height * 0.2
                            
                            const cx = xStart + col * xStep + xStep / 2
                            const cy = yStart + row * yStep + yStep / 2
                            const radius = xStep * 0.35

                            canvasCtx.strokeStyle = "rgba(0, 191, 255, 0.7)"
                            canvasCtx.lineWidth = 4
                            canvasCtx.beginPath()
                            canvasCtx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + tttHoverProgressRef.current * 2 * Math.PI)
                            canvasCtx.stroke()
                        }
                    }

                    canvasCtx.restore()
                }
            }

            if (active && activeMode !== "menu") {
                animationFrameId = requestAnimationFrame(loop)
            }
        }

        animationFrameId = requestAnimationFrame(loop)

        return () => {
            active = false
            cancelAnimationFrame(animationFrameId)
        }
    }, [activeMode, cameraReady])

    // ==========================================
    // BUBBLE POPPER GAME LOGIC
    // ==========================================
    const startBubblePopper = () => {
        setBubbleScore(0)
        bubblesRef.current = []
        nextBubbleId.current = 0
        
        // Populate initial bubbles
        for (let i = 0; i < 5; i++) {
            spawnBubble()
        }

        // Start game loop timer
        if (gameTimerRef.current) clearInterval(gameTimerRef.current)
        gameTimerRef.current = window.setInterval(() => {
            if (bubblesRef.current.length < 8) {
                spawnBubble()
            }
        }, 1200)

        showToast("Bubble Popper started! Use your INDEX FINGER to pop bubbles.", "success")
    }

    const spawnBubble = () => {
        const id = nextBubbleId.current++
        const radius = 0.04 + Math.random() * 0.035 // normalized radius
        bubblesRef.current.push({
            id,
            x: 0.15 + Math.random() * 0.7, // Keep away from extreme edges
            y: 1.0 + radius, // start below screen
            radius,
            speedY: -(0.004 + Math.random() * 0.007), // Move up
            speedX: -0.002 + Math.random() * 0.004, // Sideways drift
            color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
        })
    }

    const updateAndRenderBubbles = (
        ctx: CanvasRenderingContext2D, 
        finger: { x: number; y: number } | null
    ) => {
        const canvasW = ctx.canvas.width
        const canvasH = ctx.canvas.height

        // If hand is detected, we can render a custom cyan target reticle at finger tip
        if (finger) {
            const px = finger.x * canvasW // Mirrored by context automatically
            const py = finger.y * canvasH
            
            // Outer pulsing rings
            ctx.beginPath()
            ctx.arc(px, py, 14, 0, 2 * Math.PI)
            ctx.strokeStyle = "rgba(0, 191, 255, 0.8)"
            ctx.lineWidth = 2
            ctx.stroke()

            ctx.beginPath()
            ctx.arc(px, py, 4, 0, 2 * Math.PI)
            ctx.fillStyle = "rgba(0, 191, 255, 1)"
            ctx.fill()
        }

        // Filter and update bubble positions
        bubblesRef.current = bubblesRef.current.filter((bubble) => {
            bubble.y += bubble.speedY
            bubble.x += bubble.speedX

            // Bounce off left/right margins
            if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > 1) {
                bubble.speedX *= -1
            }

            // Check collision with index finger tip
            if (finger) {
                const dist = Math.sqrt(Math.pow(finger.x - bubble.x, 2) + Math.pow(finger.y - bubble.y, 2))
                if (dist < bubble.radius + 0.025) { // Add safety threshold
                    // Popped! Trigger feedback
                    triggerSound("pop")
                    
                    setBubbleScore((prev) => {
                        const newScore = prev + 1
                        if (newScore > bubbleHighScore) {
                            setBubbleHighScore(newScore)
                            localStorage.setItem("mindmate_bubble_highscore", newScore.toString())
                        }
                        return newScore
                    })

                    // Spawn a pop splash effect on the canvas
                    drawPopEffect(ctx, bubble)
                    return false // Remove bubble
                }
            }

            // Check if bubble drifted off top
            if (bubble.y + bubble.radius < 0) {
                return false // Remove and let it respawn
            }

            // Draw bubble with beautiful gradient and specular reflection highlight
            const px = bubble.x * canvasW // Mirrored by context automatically
            const py = bubble.y * canvasH
            const radiusPx = bubble.radius * canvasW

            ctx.beginPath()
            ctx.arc(px, py, radiusPx, 0, 2 * Math.PI)
            
            // Shiny bubble gradient fill
            const grad = ctx.createRadialGradient(
                px - radiusPx * 0.3, 
                py - radiusPx * 0.3, 
                radiusPx * 0.1, 
                px, 
                py, 
                radiusPx
            )
            grad.addColorStop(0, "rgba(255, 255, 255, 0.6)")
            grad.addColorStop(0.3, bubble.color)
            grad.addColorStop(1, "rgba(0, 0, 0, 0.3)")

            ctx.fillStyle = grad
            ctx.fill()

            // Outer bubble outline
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Specular reflection highlight dot
            ctx.beginPath()
            ctx.arc(px - radiusPx * 0.35, py - radiusPx * 0.35, radiusPx * 0.15, 0, 2 * Math.PI)
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
            ctx.fill()

            return true
        })
    }

    const drawPopEffect = (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
        const canvasW = ctx.canvas.width
        const canvasH = ctx.canvas.height
        const px = bubble.x * canvasW // Mirrored by context automatically
        const py = bubble.y * canvasH
        const radiusPx = bubble.radius * canvasW

        // draw 8 small radial splash droplets
        ctx.strokeStyle = bubble.color
        ctx.lineWidth = 2
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4
            const startR = radiusPx * 0.9
            const endR = radiusPx * 1.5
            ctx.beginPath()
            ctx.moveTo(px + Math.cos(angle) * startR, py + Math.sin(angle) * startR)
            ctx.lineTo(px + Math.cos(angle) * endR, py + Math.sin(angle) * endR)
            ctx.stroke()
        }
    }

    // ==========================================
    // TIC TAC TOE GAME LOGIC
    // ==========================================
    const renderTTTGuide = (ctx: CanvasRenderingContext2D) => {
        const canvasW = ctx.canvas.width
        const canvasH = ctx.canvas.height

        const xStart = canvasW * 0.2
        const yStart = canvasH * 0.15
        const xStep = canvasW * 0.2
        const yStep = canvasH * 0.2

        // Draw 3x3 Grid Lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"
        ctx.lineWidth = 6
        ctx.lineCap = "round"

        // Vertical lines
        ctx.beginPath()
        ctx.moveTo(xStart + xStep, yStart)
        ctx.lineTo(xStart + xStep, yStart + yStep * 3)
        ctx.moveTo(xStart + xStep * 2, yStart)
        ctx.lineTo(xStart + xStep * 2, yStart + yStep * 3)
        ctx.stroke()

        // Horizontal lines
        ctx.beginPath()
        ctx.moveTo(xStart, yStart + yStep)
        ctx.lineTo(xStart + xStep * 3, yStart + yStep)
        ctx.moveTo(xStart, yStart + yStep * 2)
        ctx.lineTo(xStart + xStep * 3, yStart + yStep * 2)
        ctx.stroke()

        // Draw symbols (X and O)
        const board = tttGameRef.current.board
        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3)
            const col = i % 3
            const cx = xStart + col * xStep + xStep / 2
            const cy = yStart + row * yStep + yStep / 2
            const cellVal = board[i]

            if (cellVal === "X") {
                // Draw X (Cyan)
                ctx.strokeStyle = "#00bfff"
                ctx.lineWidth = 8
                const size = xStep * 0.25
                ctx.beginPath()
                ctx.moveTo(cx - size, cy - size)
                ctx.lineTo(cx + size, cy + size)
                ctx.moveTo(cx + size, cy - size)
                ctx.lineTo(cx - size, cy + size)
                ctx.stroke()
            } else if (cellVal === "O") {
                // Draw O (Magenta)
                ctx.strokeStyle = "#e855f7"
                ctx.lineWidth = 8
                const radius = xStep * 0.25
                ctx.beginPath()
                ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
                ctx.stroke()
            }
        }
    }

    const startTTTGame = (mode: TTTPlayMode, symbol: "X" | "O" = tttGameRef.current.playerSymbol) => {
        let welcomeMsg = ""
        if (mode === "vs_ai") {
            welcomeMsg = symbol === "X" ? "Your turn (Player X)" : "AI's turn (Player X)"
        } else {
            welcomeMsg = symbol === "X" ? "Player 1's turn (Player X)" : "Player 2's turn (Player X)"
        }
        setTttGame({
            board: Array(9).fill(null),
            currentPlayer: "X",
            winner: null,
            status: "playing",
            resultMessage: welcomeMsg,
            playMode: mode,
            playerSymbol: symbol
        })
    }

    const resetTTTScore = () => {
        setTttScore({ x: 0, o: 0 })
        setTttGame(prev => ({
            board: Array(9).fill(null),
            currentPlayer: "X",
            winner: null,
            status: "idle",
            resultMessage: "Scores reset! Select mode to play.",
            playMode: prev.playMode,
            playerSymbol: prev.playerSymbol
        }))
    }

    const handleTTTCellPlay = (cellIndex: number, playerSymbol: "X" | "O") => {
        setTttGame(prev => {
            if (prev.board[cellIndex] !== null || prev.status !== "playing" || prev.currentPlayer !== playerSymbol) {
                return prev
            }

            const nextBoard = [...prev.board]
            nextBoard[cellIndex] = playerSymbol

            // Check win
            const wins = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ]
            let winner: TTTCell | "draw" = null
            let isWin = false

            for (const combo of wins) {
                if (
                    nextBoard[combo[0]] &&
                    nextBoard[combo[0]] === nextBoard[combo[1]] &&
                    nextBoard[combo[0]] === nextBoard[combo[2]]
                ) {
                    winner = nextBoard[combo[0]]
                    isWin = true
                    break
                }
            }

            if (!isWin && nextBoard.every(c => c !== null)) {
                winner = "draw"
            }

            let nextStatus = prev.status
            let resultMsg = prev.resultMessage
            let nextPlayer: "X" | "O" = prev.currentPlayer === "X" ? "O" : "X"

            if (winner) {
                nextStatus = "game_over"
                if (winner === "draw") {
                    resultMsg = "It's a draw!"
                    triggerSound("draw")
                } else {
                    if (prev.playMode === "vs_ai") {
                        if (winner === prev.playerSymbol) {
                            resultMsg = "You Win!"
                            triggerSound("win")
                        } else {
                            resultMsg = "AI Wins!"
                            triggerSound("lose")
                        }
                    } else {
                        resultMsg = winner === "X" ? "Player X Wins!" : "Player O Wins!"
                        triggerSound("win")
                    }
                    
                    // Update scores
                    setTttScore(score => {
                        if (winner === "X") {
                            return { ...score, x: score.x + 1 }
                        } else {
                            return { ...score, o: score.o + 1 }
                        }
                    })
                }
            } else {
                if (prev.playMode === "vs_ai") {
                    resultMsg = nextPlayer === prev.playerSymbol ? "Your turn!" : "AI is thinking..."
                } else {
                    if (prev.playerSymbol === "X") {
                        resultMsg = nextPlayer === "X" ? "Player X's turn (P1)" : "Player O's turn (P2)"
                    } else {
                        resultMsg = nextPlayer === "O" ? "Player O's turn (P1)" : "Player X's turn (P2)"
                    }
                }
                triggerSound("pop")
            }

            return {
                ...prev,
                board: nextBoard,
                currentPlayer: nextPlayer,
                winner,
                status: nextStatus,
                resultMessage: resultMsg
            }
        })
    }

    const makeAIMove = () => {
        const board = tttGameRef.current.board
        const playerSymbol = tttGameRef.current.playerSymbol || "X"
        const aiSymbol = playerSymbol === "X" ? "O" : "X"

        const emptyCells: number[] = []
        board.forEach((cell, idx) => {
            if (cell === null) emptyCells.push(idx)
        })

        if (emptyCells.length === 0) return

        const checkWinningMove = (tempBoard: TTTCell[], symbol: "X" | "O") => {
            const wins = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ]
            return wins.find(combo => 
                tempBoard[combo[0]] === symbol &&
                tempBoard[combo[1]] === symbol &&
                tempBoard[combo[2]] === symbol
            )
        }

        let chosenCell = -1

        // 1. Try to WIN
        for (const cell of emptyCells) {
            const temp = [...board]
            temp[cell] = aiSymbol
            if (checkWinningMove(temp, aiSymbol)) {
                chosenCell = cell
                break
            }
        }

        // 2. Try to BLOCK
        if (chosenCell === -1) {
            for (const cell of emptyCells) {
                const temp = [...board]
                temp[cell] = playerSymbol
                if (checkWinningMove(temp, playerSymbol)) {
                    chosenCell = cell
                    break
                }
            }
        }

        // 3. Take Center
        if (chosenCell === -1 && emptyCells.includes(4)) {
            chosenCell = 4
        }

        // 4. Take Corners
        if (chosenCell === -1) {
            const corners = [0, 2, 6, 8].filter(c => emptyCells.includes(c))
            if (corners.length > 0) {
                chosenCell = corners[Math.floor(Math.random() * corners.length)]
            }
        }

        // 5. Fallback to random
        if (chosenCell === -1) {
            chosenCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
        }

        if (chosenCell !== -1) {
            handleTTTCellPlay(chosenCell, aiSymbol)
        }
    }

    // AI move triggers
    useEffect(() => {
        if (activeMode !== "tic_tac_toe" || tttGame.status !== "playing") return
        const aiSymbol = tttGame.playerSymbol === "X" ? "O" : "X"
        if (tttGame.playMode === "vs_ai" && tttGame.currentPlayer === aiSymbol) {
            const timer = setTimeout(() => {
                makeAIMove()
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [activeMode, tttGame.currentPlayer, tttGame.status, tttGame.playMode, tttGame.playerSymbol])

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current)
        }
    }, [])

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header Dashboard Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/30 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    {activeMode !== "menu" ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-full border border-white/10 hover:bg-white/10 text-white"
                            onClick={() => {
                                if (gameTimerRef.current) clearInterval(gameTimerRef.current)
                                setActiveMode("menu")
                            }}
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-full border border-white/10 hover:bg-white/10 text-white"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            {activeMode === "menu" && "Gesture Arcade"}
                            {activeMode === "bubble_popper" && "Bubble Popper"}
                            {activeMode === "tic_tac_toe" && "Tic Tac Toe"}
                            <Gamepad2 className="size-6 text-primary" />
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                            {activeMode === "menu" && "Play premium hands-free mini-games using camera gestures!"}
                            {activeMode === "bubble_popper" && "Pop rising bubbles using your index finger tip."}
                            {activeMode === "tic_tac_toe" && "Play Tic Tac Toe: Solo (vs AI) or Local Multiplayer (vs Friend)."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 rounded-full border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
                        onClick={() => setIsMuted(!isMuted)}
                        title={isMuted ? "Unmute" : "Mute Sound"}
                    >
                        {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                    </Button>
                </div>
            </div>

            {/* Menu Selection screen */}
            {activeMode === "menu" && (
                <>
                    <div className="grid gap-6 md:grid-cols-2 mt-6">
                        {/* Game 1: Bubble Popper Card */}
                        <GlassCard 
                            gradient 
                            className="p-8 group cursor-pointer flex flex-col justify-between min-h-[300px] border border-white/10 hover:border-primary/40 rounded-3xl"
                            onClick={() => {
                                setActiveMode("bubble_popper")
                                setTimeout(startBubblePopper, 800)
                            }}
                        >
                            <div className="space-y-4">
                                <div className="size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                                    <Circle className="size-8 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-extrabold text-white group-hover:text-primary transition-colors">Bubble Popper</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Move your hand in front of the camera. The game tracks your index finger tip in real time. Reach out and pop bubbles to hit a high score!
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                                    <Trophy className="size-4 text-yellow-500" />
                                    High Score: {bubbleHighScore} pts
                                </span>
                                <span className="text-xs font-black uppercase text-primary group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                                    Play Game <Play className="size-3 fill-primary" />
                                </span>
                            </div>
                        </GlassCard>

                        {/* Game 2: Tic Tac Toe Card */}
                        <GlassCard 
                            gradient 
                            className="p-8 group cursor-pointer flex flex-col justify-between min-h-[300px] border border-white/10 hover:border-purple-500/40 rounded-3xl"
                            onClick={() => {
                                setActiveMode("tic_tac_toe")
                                startTTTGame("vs_ai")
                            }}
                        >
                            <div className="space-y-4">
                                <div className="size-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                                    <Sparkles className="size-8 text-purple-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-extrabold text-white group-hover:text-purple-400 transition-colors">Tic Tac Toe</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Play the classic 3x3 grid game. Hover your index finger over a cell to select it, or click/tap cells directly. Challenge our smart AI or play against a friend!
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                                    <Gamepad2 className="size-4 text-purple-400" />
                                    Solo vs AI & 2-Player modes
                                </span>
                                <span className="text-xs font-black uppercase text-purple-400 group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                                    Start Game <Play className="size-3 fill-purple-400" />
                                </span>
                            </div>
                        </GlassCard>
                    </div>

                    {/* How to Play Guide Panel */}
                    <GlassCard className="mt-8 border border-white/10 p-8 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Gamepad2 className="size-6 text-primary" />
                            <h2 className="text-xl font-extrabold text-white">How to Play & Gesture Guide</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Bubble Popper Instructions */}
                            <div className="space-y-4 bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl">
                                <h3 className="text-md font-black text-indigo-400 flex items-center gap-2">
                                    <Circle className="size-5 fill-indigo-400/20 text-indigo-400" />
                                    Bubble Popper Instructions
                                </h3>
                                <ul className="space-y-3 text-sm text-zinc-300">
                                    <li className="flex gap-2">
                                        <span className="flex items-center justify-center size-5 rounded-full bg-indigo-500 text-white font-bold text-xs shrink-0 mt-0.5">1</span>
                                        <span>Stand <strong>3–5 feet away</strong> from the camera so your upper body/hand is fully in frame.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="flex items-center justify-center size-5 rounded-full bg-indigo-500 text-white font-bold text-xs shrink-0 mt-0.5">2</span>
                                        <span>Use your <strong>Index Finger</strong> to point. A cyan target reticle will follow your finger tip when tracked.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="flex items-center justify-center size-5 rounded-full bg-indigo-500 text-white font-bold text-xs shrink-0 mt-0.5">3</span>
                                        <span>Move your finger over the <strong>floating bubbles</strong> to pop them and score points!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Tic Tac Toe Instructions */}
                            <div className="space-y-4 bg-purple-500/5 border border-purple-500/10 p-6 rounded-2xl">
                                <h3 className="text-md font-black text-purple-400 flex items-center gap-2">
                                    <Sparkles className="size-5 text-purple-400" />
                                    Tic Tac Toe Instructions
                                </h3>
                                <ul className="space-y-3 text-sm text-zinc-300">
                                    <li className="flex gap-2">
                                        <span className="flex items-center justify-center size-5 rounded-full bg-purple-500 text-white font-bold text-xs shrink-0 mt-0.5">1</span>
                                        <span>Select <strong>Vs AI</strong> (to play solo against the computer) or <strong>Vs Friend</strong> (local 2-player).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="flex items-center justify-center size-5 rounded-full bg-purple-500 text-white font-bold text-xs shrink-0 mt-0.5">2</span>
                                        <span>Use your <strong>Index Finger</strong> to hover over an empty cell for <strong>1.2 seconds</strong> (loading ring progress) OR click directly.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="flex items-center justify-center size-5 rounded-full bg-purple-500 text-white font-bold text-xs shrink-0 mt-0.5">3</span>
                                        <span>Get <strong>three in a row</strong> (horizontal, vertical, diagonal) to win. Good luck!</span>
                                    </li>
                                </ul>
                                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-zinc-400">
                                    <div className="flex flex-col items-center bg-black/40 border border-white/5 p-2 rounded-xl text-center">
                                        <span className="text-lg text-[#00bfff] font-black">X</span>
                                        <span className="font-bold text-white mt-1">Player X</span>
                                        <span className="text-[9px] text-zinc-500 mt-0.5">Your Turn (Cyan)</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-black/40 border border-white/5 p-2 rounded-xl text-center">
                                        <span className="text-lg text-[#e855f7] font-black">O</span>
                                        <span className="font-bold text-white mt-1">Player O</span>
                                        <span className="text-[9px] text-zinc-500 mt-0.5">AI/Friend (Magenta)</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-black/40 border border-white/5 p-2 rounded-xl text-center">
                                        <span className="text-lg">⏱️</span>
                                        <span className="font-bold text-white mt-1">1.2s Hold</span>
                                        <span className="text-[9px] text-zinc-500 mt-0.5">Index Finger Hover</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Room Setup Tips */}
                        <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl">
                                <Sparkles className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-white">Perfect Setup Tips for Best Gesture Tracking</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Ensure your room is <strong>well-lit</strong>, avoid strong backlighting (like sitting right in front of a bright window), and keep your hand fully inside the camera grid box.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </>
            )}

            {/* Interactive Webcam Play Area */}
            {activeMode !== "menu" && (
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Left side: Camera View & Canvas */}
                    <div className="md:col-span-8 space-y-4">
                        <Card className="relative aspect-video rounded-3xl border border-white/10 bg-black/60 shadow-2xl overflow-hidden">
                            {/* Webcam stream */}
                            <Webcam
                                mirrored
                                audio={false}
                                onUserMedia={() => {
                                    setCameraReady(true)
                                }}
                                ref={(webcam) => {
                                    if (webcam) {
                                        videoRef.current = webcam.video
                                    }
                                }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* Joint tracking and game overlay Canvas */}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover z-25"
                            />

                            {/* Camera loading HUD */}
                            {!cameraReady && (
                                <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-3 z-30">
                                    <Camera className="size-10 text-primary animate-pulse" />
                                    <p className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Accessing Webcam Feed...</p>
                                </div>
                            )}

                            {/* Bubble Popper HUD Overlay */}
                            {activeMode === "bubble_popper" && cameraReady && (
                                <div className="absolute top-4 left-4 z-30 flex gap-4 pointer-events-none">
                                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex flex-col">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Score</span>
                                        <span className="text-2xl font-black text-indigo-400">{bubbleScore}</span>
                                    </div>
                                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex flex-col">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">High Score</span>
                                        <span className="text-2xl font-black text-yellow-400">{bubbleHighScore}</span>
                                    </div>
                                </div>
                            )}

                            {/* Tic Tac Toe Interactive Overlay Grid */}
                            {activeMode === "tic_tac_toe" && tttGame.status === "playing" && (
                                <div 
                                    className="absolute z-30 grid grid-cols-3 grid-rows-3"
                                    style={{
                                        left: "20%",
                                        right: "20%",
                                        top: "15%",
                                        bottom: "25%"
                                    }}
                                >
                                    {Array(9).fill(null).map((_, idx) => {
                                        const isEmpty = tttGame.board[idx] === null;
                                        const isUserTurn = tttGame.status === "playing" && (tttGame.playMode === "vs_player" || tttGame.currentPlayer === "X");
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (isUserTurn && isEmpty) {
                                                        handleTTTCellPlay(idx, tttGame.currentPlayer);
                                                    }
                                                }}
                                                disabled={!isUserTurn || !isEmpty}
                                                className={`w-full h-full flex items-center justify-center transition-all duration-200 border border-transparent ${
                                                    isEmpty && isUserTurn 
                                                        ? "hover:bg-white/10 hover:border-white/20 cursor-pointer" 
                                                        : "cursor-default"
                                                }`}
                                            >
                                                {/* Cell contents are drawn on the canvas, so this remains transparent */}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Tic Tac Toe Game Over Overlay */}
                            {activeMode === "tic_tac_toe" && tttGame.status === "game_over" && (
                                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-6">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-zinc-950/90 border border-white/10 p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl flex flex-col gap-6"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex justify-center">
                                                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                                    <Trophy className="size-8 text-yellow-500 animate-bounce" />
                                                </div>
                                            </div>
                                            <h2 className="text-3xl font-black text-white tracking-tight">
                                                {tttGame.winner === "draw" ? "It's a Draw!" : `${tttGame.winner === "X" ? "Player X" : "Player O"} Wins!`}
                                            </h2>
                                            <p className="text-sm text-zinc-400">
                                                {tttGame.winner === "draw" 
                                                    ? "An even match! Both played perfectly." 
                                                    : tttGame.playMode === "vs_ai" && tttGame.winner === "X"
                                                        ? "You defeated the AI! Excellent work."
                                                        : tttGame.playMode === "vs_ai" && tttGame.winner === "O"
                                                            ? "The AI won this round. Try again!"
                                                            : "Congratulations on the victory!"
                                                }
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button
                                                onClick={() => startTTTGame(tttGame.playMode)}
                                                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-500 text-white font-bold h-12 rounded-2xl"
                                            >
                                                <RotateCcw className="size-4 mr-2" />
                                                Play Again
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setTttGame(prev => ({ ...prev, status: "idle", winner: null }));
                                                }}
                                                className="w-full border-white/10 text-white hover:bg-white/5 font-semibold h-11 rounded-2xl"
                                            >
                                                View Board
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right side: Game Controls and HUD */}
                    <div className="md:col-span-4 space-y-4">
                        {/* Bubble Popper HUD Cards */}
                        {activeMode === "bubble_popper" && (
                            <GlassCard className="p-6 border border-white/10 space-y-6 rounded-3xl h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="font-extrabold text-white text-lg flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Trophy className="size-5 text-yellow-500" />
                                        Instructions
                                    </h3>
                                    <ul className="text-xs text-zinc-350 space-y-3 pl-4 list-disc leading-relaxed">
                                        <li>Position yourself so your hand is fully in frame.</li>
                                        <li>Use your <strong>Index Finger</strong> tip to pop color bubbles floating on screen.</li>
                                        <li>A cyan reticle highlights your finger tip when tracked.</li>
                                        <li>Pop as many bubbles as you can to get the high score!</li>
                                    </ul>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <Button
                                        onClick={startBubblePopper}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold h-12 rounded-2xl shadow-lg"
                                    >
                                        <RotateCcw className="size-4 mr-2" />
                                        Restart Game
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (gameTimerRef.current) clearInterval(gameTimerRef.current)
                                            setActiveMode("menu")
                                        }}
                                        className="w-full border-white/10 text-white hover:bg-white/5 font-semibold h-11 rounded-2xl"
                                    >
                                        Back to Arcade Menu
                                    </Button>
                                </div>
                            </GlassCard>
                        )}

                        {/* Tic Tac Toe HUD Cards */}
                        {activeMode === "tic_tac_toe" && (
                            <GlassCard className="p-6 border border-white/10 space-y-6 rounded-3xl h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    {/* Matches Scoreboard */}
                                    <h3 className="font-extrabold text-white text-lg flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Trophy className="size-5 text-purple-400" />
                                        Scoreboard
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center justify-center gap-1">
                                                <User className="size-3 text-[#00bfff]" />
                                                {tttGame.playMode === "vs_ai" 
                                                    ? (tttGame.playerSymbol === "X" ? "Player X (You)" : "Player X (AI)") 
                                                    : (tttGame.playerSymbol === "X" ? "Player X (P1)" : "Player X (P2)")}
                                            </span>
                                            <span className="text-3xl font-black text-white">{tttScore.x}</span>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center justify-center gap-1">
                                                {tttGame.playMode === "vs_ai" ? (
                                                    <>
                                                        <Cpu className="size-3 text-[#e855f7]" />
                                                        {tttGame.playerSymbol === "O" ? "Player O (You)" : "Player O (AI)"}
                                                    </>
                                                ) : (
                                                    <>
                                                        <User className="size-3 text-[#e855f7]" />
                                                        {tttGame.playerSymbol === "O" ? "Player O (P1)" : "Player O (P2)"}
                                                    </>
                                                )}
                                            </span>
                                            <span className="text-3xl font-black text-white">{tttScore.o}</span>
                                        </div>
                                    </div>

                                    {/* Action HUD / Result Cards */}
                                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 text-center min-h-[100px] flex flex-col justify-center items-center gap-2">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-black">Status</span>
                                        <p className="text-sm font-bold text-zinc-200 text-center leading-snug">
                                            {tttGame.resultMessage}
                                        </p>
                                        {tttGame.status === "playing" && (
                                            <div className="mt-1 flex items-center gap-1.5 justify-center">
                                                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                                                    Current: {tttGame.currentPlayer}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mode indicator and selection helper */}
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
                                        <span className="text-[10px] font-black uppercase text-zinc-400 block">Game Mode</span>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    startTTTGame("vs_ai");
                                                }}
                                                size="sm"
                                                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                                                    tttGame.playMode === "vs_ai" 
                                                        ? "bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/30 hover:bg-[#00bfff]/30" 
                                                        : "bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                <Cpu className="size-3.5 mr-1" />
                                                Vs AI
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    startTTTGame("vs_player");
                                                }}
                                                size="sm"
                                                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                                                    tttGame.playMode === "vs_player" 
                                                        ? "bg-[#e855f7]/20 text-[#e855f7] border border-[#e855f7]/30 hover:bg-[#e855f7]/30" 
                                                        : "bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                <User className="size-3.5 mr-1" />
                                                Vs Friend
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Symbol Selection */}
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
                                        <span className="text-[10px] font-black uppercase text-zinc-400 block">
                                            {tttGame.playMode === "vs_ai" ? "Your Symbol" : "Player 1 Symbol"}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    startTTTGame(tttGame.playMode, "X");
                                                }}
                                                size="sm"
                                                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                                                    tttGame.playerSymbol === "X"
                                                        ? "bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/30 hover:bg-[#00bfff]/30"
                                                        : "bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                Play as X
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    startTTTGame(tttGame.playMode, "O");
                                                }}
                                                size="sm"
                                                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                                                    tttGame.playerSymbol === "O"
                                                        ? "bg-[#e855f7]/20 text-[#e855f7] border border-[#e855f7]/30 hover:bg-[#e855f7]/30"
                                                        : "bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                Play as O
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    {(tttGame.status === "game_over" || tttGame.status === "idle") && (
                                        <Button
                                            onClick={() => startTTTGame(tttGame.playMode)}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 rounded-2xl shadow-lg"
                                        >
                                            <Play className="size-4 mr-2 fill-white" />
                                            Play Round
                                        </Button>
                                    )}
                                    {tttGame.status === "playing" && (
                                        <Button
                                            onClick={() => startTTTGame(tttGame.playMode)}
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-12 rounded-2xl"
                                        >
                                            <RotateCcw className="size-4 mr-2" />
                                            Restart Board
                                        </Button>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={resetTTTScore}
                                            className="flex-1 border-white/10 text-white hover:bg-white/5 font-semibold h-11 rounded-2xl text-xs"
                                        >
                                            Reset Scores
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setActiveMode("menu")}
                                            className="flex-1 border-white/10 text-white hover:bg-white/5 font-semibold h-11 rounded-2xl text-xs"
                                        >
                                            Arcade Menu
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
