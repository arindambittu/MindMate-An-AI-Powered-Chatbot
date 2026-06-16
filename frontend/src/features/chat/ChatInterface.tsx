import { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import {
    User2,
    Paperclip,
    Mic,
    MicOff,
    History,
    Plus,
    MessageSquarePlus,
    MessagesSquare,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Camera,
    X,
    Cpu,
    Sparkles,
    WifiOff,
    AlertCircle,
    Zap,
    Loader2,
    Copy,
    Check,
    Volume2,
    ThumbsUp,
    ThumbsDown,
    Search,
    ArrowDown,
    HelpCircle,
    Hand,
    Download
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion, AnimatePresence } from "framer-motion"
import { Hands, Results, HAND_CONNECTIONS } from "@mediapipe/hands"
import * as drawingUtils from "@mediapipe/drawing_utils"
import { useAuth } from "../../context/AuthContext"
import { Skeleton, ChatSkeleton } from "../../components/ui/Skeleton"
import Webcam from "react-webcam"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"
import { useToast } from "../../components/ui/Toast"

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    image?: string;
    pdf?: { name: string; data: string };
    timestamp?: string;
}

interface Conversation {
    id: number;
    title: string;
    created_at: string;
}

interface GestureDisplayInfo {
    emoji: string;
    name: string;
    meaning: string;
    category: string;
}

const GESTURE_MAP: Record<string, GestureDisplayInfo> = {
    thumbs_up: {
        emoji: "👍",
        name: "Thumbs Up",
        meaning: "Approval, agreement, or 'all good'.",
        category: "Positive"
    },
    thumbs_down: {
        emoji: "👎",
        name: "Thumbs Down",
        meaning: "Disapproval, disagreement, or 'no'.",
        category: "Negative"
    },
    ok_hand: {
        emoji: "👌",
        name: "OK Hand",
        meaning: "Okay, perfect, or no problem.",
        category: "Positive"
    },
    peace: {
        emoji: "✌️",
        name: "Peace Sign / Victory",
        meaning: "Peace, victory, or chill out.",
        category: "Positive"
    },
    i_love_you: {
        emoji: "🤟",
        name: "I Love You",
        meaning: "ASL sign for I love you.",
        category: "Positive"
    },
    rock_on: {
        emoji: "🤘",
        name: "Rock On / Horns",
        meaning: "Rock on, party, or excitement!",
        category: "Positive"
    },
    fist: {
        emoji: "👊",
        name: "Fist Bump / Fist",
        meaning: "Friendly greeting, respect, or mute action.",
        category: "Positive"
    },
    pointing: {
        emoji: "👉",
        name: "Pointing",
        meaning: "Look there or focus on that.",
        category: "Neutral"
    },
    stop_hand: {
        emoji: "✋",
        name: "Stop Hand / High Five",
        meaning: "Stop, wait, or high five!",
        category: "Neutral"
    },
    pushing_hand: {
        emoji: "🫸",
        name: "Pushing Hand",
        meaning: "Pushing away, back off, or no thanks.",
        category: "Negative"
    },
    middle_finger: {
        emoji: "🖕",
        name: "Middle Finger",
        meaning: "Strong disapproval or disrespect.",
        category: "Negative"
    },
    salute: {
        emoji: "🫡",
        name: "Salute",
        meaning: "Respect, hello, or military greeting.",
        category: "Neutral"
    },
    tap_temple: {
        emoji: "🧠",
        name: "Tap Temple",
        meaning: "Think, smart, or use your brain.",
        category: "Neutral"
    },
    thinking_face: {
        emoji: "🤔",
        name: "Thinking Face",
        meaning: "Hmm, pondering or curious.",
        category: "Neutral"
    },
    quiet_please: {
        emoji: "🤫",
        name: "Quiet Please",
        meaning: "Shh, silence or hush.",
        category: "Situational"
    },
    zipper_mouth: {
        emoji: "🤐",
        name: "Zipper Mouth",
        meaning: "My lips are sealed / secret.",
        category: "Neutral"
    },
    pinching_fingers: {
        emoji: "🤏",
        name: "Pinching Fingers",
        meaning: "A tiny bit or small amount.",
        category: "Neutral"
    },
    chefs_kiss: {
        emoji: "🤌",
        name: "Chef's Kiss",
        meaning: "Perfect, delicious, or exquisite!",
        category: "Positive"
    },
    im_watching_you: {
        emoji: "👀",
        name: "I'm Watching You",
        meaning: "Keeping an eye on things.",
        category: "Situational"
    },
    facepalm: {
        emoji: "🤦",
        name: "Facepalm",
        meaning: "Embarrassment, disbelief, or frustration.",
        category: "Negative"
    },
    money: {
        emoji: "🤌",
        name: "Money Gesture",
        meaning: "Costs money, pay up, or cash.",
        category: "Neutral"
    },
    flexed_bicep: {
        emoji: "💪",
        name: "Flexed Bicep",
        meaning: "Strength, confidence, or 'I got this!'",
        category: "Positive"
    },
    call_me: {
        emoji: "🤙",
        name: "Call Me / Shaka",
        meaning: "Call me later or hang loose.",
        category: "Neutral"
    },
    heart_hands: {
        emoji: "🫶",
        name: "Heart Hands",
        meaning: "Love, care, and warm affection.",
        category: "Positive"
    },
    clap: {
        emoji: "👏",
        name: "Clap / Applause",
        meaning: "Well done, approval, or celebration.",
        category: "Positive"
    },
    folded_hands: {
        emoji: "🙏",
        name: "Folded Hands",
        meaning: "Thank you, please, or gratitude.",
        category: "Neutral"
    },
    arms_in_x: {
        emoji: "🙅",
        name: "Arms in X",
        meaning: "No, stop, or not happening.",
        category: "Negative"
    },
    sports_timeout: {
        emoji: "🕒",
        name: "Sports Timeout",
        meaning: "Time out or take a break.",
        category: "Situational"
    },
    air_quotes: {
        emoji: "✌️✌️",
        name: "Air Quotes",
        meaning: "Sarcasm, irony, or 'so-called'.",
        category: "Situational"
    },
    raised_hands: {
        emoji: "🙌",
        name: "Raised Hands",
        meaning: "Yay, victory, or celebration!",
        category: "Positive"
    },
    shrug: {
        emoji: "🤷",
        name: "Shrug",
        meaning: "I don't know, no idea, or whatever.",
        category: "Neutral"
    },
    shaka: {
        emoji: "🤙",
        name: "Shaka",
        meaning: "Hang loose, take it easy.",
        category: "Positive"
    },
    fist_bump: {
        emoji: "👊",
        name: "Fist Bump",
        meaning: "Respect, greeting, or solidarity.",
        category: "Positive"
    },
    wave: {
        emoji: "👋",
        name: "Wave",
        meaning: "Hello or goodbye.",
        category: "Neutral"
    }
};

const calculateDistance = (pt1: any, pt2: any) => {
    return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
};

const analyzeSingleHandLocally = (hand: any[]): string => {
    if (!hand || hand.length < 21) return "none";

    try {
        const getPt = (idx: number) => hand[idx];
        const dist = (i: number, j: number) => calculateDistance(getPt(i), getPt(j));

        // Check if each finger is extended (distance from wrist to tip vs wrist to PIP joint)
        const indexExt = dist(8, 0) > dist(6, 0);
        const middleExt = dist(12, 0) > dist(10, 0);
        const ringExt = dist(16, 0) > dist(14, 0);
        const pinkyExt = dist(20, 0) > dist(18, 0);
        
        // Thumb extension is checked horizontally against Pinky base and Index base
        const thumbExt = dist(4, 5) > dist(2, 5) || dist(4, 17) > dist(2, 17);
        
        const extCount = (indexExt ? 1 : 0) + (middleExt ? 1 : 0) + (ringExt ? 1 : 0) + (pinkyExt ? 1 : 0);
        
        // --- 1. OK Hand ---
        if (dist(4, 8) < 0.04 && middleExt && ringExt && pinkyExt) {
            return "ok_hand";
        }
            
        // --- 2. Chef's Kiss (all tips pinched together) ---
        if (dist(4, 8) < 0.05 && dist(4, 12) < 0.05 && dist(4, 16) < 0.05 && dist(4, 20) < 0.05) {
            if (getPt(12).y < getPt(0).y) {
                return "chefs_kiss";
            }
        }

        // --- 3. Zipper Mouth / Money / Pinching ---
        if (dist(4, 8) < 0.035 && !middleExt && !ringExt && !pinkyExt) {
            const x = getPt(8).x;
            const y = getPt(8).y;
            if (0.4 < x && x < 0.6 && 0.45 < y && y < 0.7) {
                return "zipper_mouth";
            }
            return "money";
        }
            
        if (0.02 < dist(4, 8) && dist(4, 8) < 0.065 && !middleExt && !ringExt && !pinkyExt) {
            return "pinching_fingers";
        }

        // --- 4. Thumbs Up / Down / Fist ---
        if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
            if (thumbExt || dist(4, 5) > dist(2, 5)) {
                if (getPt(4).y < getPt(2).y) {
                    return "thumbs_up";
                } else {
                    return "thumbs_down";
                }
            }
            return "fist";
        }

        // --- 5. Peace Sign / Victory / Crossed Fingers ---
        if (indexExt && middleExt && !ringExt && !pinkyExt) {
            if (dist(8, 12) < 0.035) {
                return "crossed_fingers";
            }
            return "peace";
        }

        // --- 6. I'm Watching You (horizontal peace sign near eye region) ---
        if (indexExt && middleExt && !ringExt && !pinkyExt) {
            if (Math.abs(getPt(8).y - getPt(12).y) < 0.04 && Math.abs(getPt(8).x - getPt(12).x) > 0.04) {
                if (getPt(8).y < 0.45) {
                    return "im_watching_you";
                }
            }
        }

        // --- 7. I Love You (thumb + index + pinky) ---
        if (indexExt && pinkyExt && thumbExt && !middleExt && !ringExt) {
            return "i_love_you";
        }

        // --- 8. Rock On / Horns (index + pinky) ---
        if (indexExt && pinkyExt && !middleExt && !ringExt) {
            return "rock_on";
        }

        // --- 9. Call Me / Shaka (thumb + pinky) ---
        if (thumbExt && pinkyExt && !indexExt && !middleExt && !ringExt) {
            return "call_me";
        }

        // --- 10. Pointing / Quiet Please / Tap Temple / Thinking Face ---
        if (indexExt && !middleExt && !ringExt && !pinkyExt) {
            const x = getPt(8).x;
            const y = getPt(8).y;
            if (0.42 < x && x < 0.58 && 0.35 < y && y < 0.65 && Math.abs(getPt(8).x - getPt(6).x) < 0.04) {
                return "quiet_please";
            }
            if (y < 0.35 && (x < 0.35 || x > 0.65)) {
                return "tap_temple";
            }
            if (thumbExt && y < 0.7) {
                return "thinking_face";
            }
            return "pointing";
        }

        // --- 11. Middle Finger ---
        if (middleExt && !indexExt && !ringExt && !pinkyExt) {
            return "middle_finger";
        }

        // --- 12. Stop Hand / Open Palm / Pushing Hand / Facepalm / Salute ---
        if (extCount >= 3) {
            const x = getPt(9).x;
            if (0.38 < x && x < 0.62 && 0.2 < getPt(12).y && getPt(12).y < 0.55) {
                return "facepalm";
            }
            if (getPt(0).y < 0.4 && Math.abs(getPt(8).y - getPt(20).y) < 0.06 && Math.abs(getPt(8).x - getPt(0).x) > 0.12) {
                return "salute";
            }
            if (Math.abs(getPt(0).y - getPt(9).y) < 0.08) {
                return "pushing_hand";
            }
            return "stop_hand";
        }

    } catch (e) {
        console.error("Error in single hand local classification:", e);
    }
    return "none";
};

const analyzeTwoHandsLocally = (h1: any[], h2: any[]): string => {
    try {
        const getH1Pt = (idx: number) => h1[idx];
        const getH2Pt = (idx: number) => h2[idx];
        const distBetween = (i: number, j: number) => calculateDistance(getH1Pt(i), getH2Pt(j));
        const getH1Dist = (i: number, j: number) => calculateDistance(getH1Pt(i), getH1Pt(j));
        const getH2Dist = (i: number, j: number) => calculateDistance(getH2Pt(i), getH2Pt(j));

        const h1IdxExt = getH1Dist(8, 0) > getH1Dist(6, 0);
        const h1MidExt = getH1Dist(12, 0) > getH1Dist(10, 0);
        const h1RingExt = getH1Dist(16, 0) > getH1Dist(14, 0);
        const h1PinkyExt = getH1Dist(20, 0) > getH1Dist(18, 0);
        
        const h2IdxExt = getH2Dist(8, 0) > getH2Dist(6, 0);
        const h2MidExt = getH2Dist(12, 0) > getH2Dist(10, 0);
        const h2RingExt = getH2Dist(16, 0) > getH2Dist(14, 0);
        const h2PinkyExt = getH2Dist(20, 0) > getH2Dist(18, 0);

        const h1ExtCount = (h1IdxExt ? 1 : 0) + (h1MidExt ? 1 : 0) + (h1RingExt ? 1 : 0) + (h1PinkyExt ? 1 : 0);
        const h2ExtCount = (h2IdxExt ? 1 : 0) + (h2MidExt ? 1 : 0) + (h2RingExt ? 1 : 0) + (h2PinkyExt ? 1 : 0);

        // 1. Heart Hands
        if (distBetween(4, 4) < 0.08 && distBetween(8, 8) < 0.08) {
            return "heart_hands";
        }

        // 2. Folded Hands
        if (h1ExtCount >= 3 && h2ExtCount >= 3) {
            if (getH1Pt(12).y < getH1Pt(0).y && getH2Pt(12).y < getH2Pt(0).y) {
                if (distBetween(12, 12) < 0.08 && distBetween(0, 0) < 0.1) {
                    return "folded_hands";
                }
            }
        }

        // 3. Clap
        if (h1ExtCount >= 3 && h2ExtCount >= 3) {
            if (distBetween(9, 9) < 0.12 && distBetween(0, 0) < 0.12) {
                return "clap";
            }
        }

        // 4. Arms in X
        if (distBetween(0, 0) < 0.12) {
            if ((getH1Pt(0).x - getH2Pt(0).x) * (getH1Pt(9).x - getH2Pt(9).x) < 0) {
                return "arms_in_x";
            }
        }

        // 5. Sports Timeout
        if (distBetween(12, 9) < 0.08 || distBetween(9, 12) < 0.08) {
            const h1Vec = { x: getH1Pt(12).x - getH1Pt(0).x, y: getH1Pt(12).y - getH1Pt(0).y };
            const h2Vec = { x: getH2Pt(12).x - getH2Pt(0).x, y: getH2Pt(12).y - getH2Pt(0).y };
            const h1IsVert = Math.abs(h1Vec.y) > Math.abs(h1Vec.x);
            const h2IsVert = Math.abs(h2Vec.y) > Math.abs(h2Vec.x);
            if (h1IsVert !== h2IsVert) {
                return "sports_timeout";
            }
        }

        // 6. Air Quotes
        if (h1IdxExt && h1MidExt && !h1RingExt && !h1PinkyExt) {
            if (h2IdxExt && h2MidExt && !h2RingExt && !h2PinkyExt) {
                return "air_quotes";
            }
        }

        // 7. Raised Hands
        if (h1ExtCount >= 3 && h2ExtCount >= 3) {
            if (getH1Pt(0).y < 0.35 && getH2Pt(0).y < 0.35) {
                return "raised_hands";
            }
        }

        // 8. Shrug
        if (h1ExtCount >= 3 && h2ExtCount >= 3) {
            if (distBetween(0, 0) > 0.22) {
                return "shrug";
            }
        }

    } catch (e) {
        console.error("Error in two hands local classification:", e);
    }
    return "none";
};

const classifyGestureLocally = (multiHandLandmarks: any[]): string => {
    if (!multiHandLandmarks || multiHandLandmarks.length === 0) return "none";

    // Check two-hand gestures first
    if (multiHandLandmarks.length >= 2) {
        const twoHandRes = analyzeTwoHandsLocally(multiHandLandmarks[0], multiHandLandmarks[1]);
        if (twoHandRes !== "none") return twoHandRes;
    }

    // Fallback to single hand
    if (multiHandLandmarks.length > 0) {
        return analyzeSingleHandLocally(multiHandLandmarks[0]);
    }

    return "none";
};

const getLocalResponse = (text: string): string | null => {
    const cleanText = text.toLowerCase().trim();
    if (!cleanText) return null;

    // 1. Severe Anxiety / Panic Attack
    if (
        cleanText.includes("panic") ||
        cleanText.includes("anxious") ||
        cleanText.includes("anxiety") ||
        cleanText.includes("hyperventilating") ||
        cleanText.includes("can't breathe") ||
        cleanText.includes("cant breathe")
    ) {
        return `### 🌬️ Instant Anxiety & Panic Support
Take a slow, deep breath. **You are safe and this feeling will pass.**

To help you ground yourself immediately, try **Box Breathing** in our **Calm Corner** or follow these steps right now:
1. **Inhale** slowly through your nose for **4 seconds**.
2. **Hold** your breath for **4 seconds**.
3. **Exhale** completely through your mouth for **4 seconds**.
4. **Hold** empty for **4 seconds**.

Repeat this cycle 4 times. You can access guided exercises directly by clicking the **Calm Corner** in the navigation menu.`;
    }

    // 2. Stress / Overwhelm / Burnout
    if (
        cleanText.includes("stress") ||
        cleanText.includes("overwhelmed") ||
        cleanText.includes("too much") ||
        cleanText.includes("burnout") ||
        cleanText.includes("exhausted")
    ) {
        return `### 🌿 Stress Relief & Mindfulness
It sounds like you are carrying a lot right now. Let's take a moment to reset:

*   **Take a Step Back:** Put down what you are doing. Let your shoulders drop.
*   **Try Equal Breathing:** Go to the **Calm Corner** to try guided **Equal Breathing** to quickly balance your nervous system.
*   **Play a Game:** Try our **Gesture Game** to engage your hand-eye coordination and distract your mind from racing thoughts.

Remember: you don't have to solve everything today. Focus on just the next small step.`;
    }

    // 3. Emergency / Crisis Support
    if (
        cleanText.includes("suicide") ||
        cleanText.includes("suicidal") ||
        cleanText.includes("self harm") ||
        cleanText.includes("self-harm") ||
        cleanText.includes("hurt myself") ||
        cleanText.includes("want to die") ||
        cleanText.includes("kill myself")
    ) {
        return `### ⚠️ Immediate Support Available
Please know that you are not alone, and there is help available right now. Your safety and well-being are incredibly important.

If you are in distress or having thoughts of self-harm, please reach out to one of these free, confidential professional resources immediately:
*   **National Suicide & Crisis Lifeline:** Call or text **988** (Available 24/7 in the US & Canada).
*   **Crisis Text Line:** Text **HOME** to **741741** to connect with a crisis counselor.
*   **UK Crisis Services:** Call **111** (NHS) or **999** for emergency support, or call Samaritans at **116 123**.
*   **International:** Find a local helpline in your country at [Befrienders Worldwide](https://www.befrienders.org/) or [Find A Helpline](https://findahelpline.com/).

Please reach out to a trusted friend, family member, or professional who can support you through this.`;
    }

    // 4. Bored / Distraction / Games
    if (
        cleanText.includes("bored") ||
        cleanText.includes("distract") ||
        cleanText.includes("game") ||
        cleanText.includes("play") ||
        cleanText.includes("gesture game")
    ) {
        return `### 🎮 Mindful Play & Distraction
Let's bring your focus to the present moment through play! 

We have some great interactive features to divert and calm your mind:
1. **Gesture Game:** Go to the **Gesture Game** tab. It uses your webcam to track hand gestures (like Peace ✌️, Fist ✊, or Thumbs Up 👍) to play fun coordination challenges.
2. **Gesture Commands:** Turn on **Gesture Mode** using the hand icon in the header above. You can control this chat with gestures:
   *   ✌️ (Peace Sign) - Trigger a quick prompt to clear the current chat.
   *   ✊ (Fist Sign) - Mute the AI read-aloud voice immediately.`;
    }

    // 5. Help / Info / Commands
    if (
        cleanText === "help" ||
        cleanText.includes("what can you do") ||
        cleanText.includes("features") ||
        cleanText.includes("how to use")
    ) {
        return `### 🛠️ How to Use MindMate
I am your wellness assistant, configured with immediate local responses to help you navigate stress, anxiety, and wellness exercises.

Here are the key areas you can explore:
*   🌬️ **Calm Corner:** Guided breathing exercises (Box, 4-7-8, Equal Breathing) to regulate your breathing and calm your heart rate.
*   🎮 **Gesture Game:** Webcam-powered hand tracking games to challenge your focus and coordination.
*   🖐️ **Gesture Mode:** Control the chat interface hands-free (using gestures like Peace to clear chat or Fist to mute voice).
*   💬 **Empathetic Chat:** Ask me anything! I support text-to-speech (read aloud), markdown formatting, and document uploads (PDF/Images).

Let me know if you would like support with anxiety, stress, or navigating these features.`;
    }

    return null;
};

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hello! I'm MindMate. How can I help you today?", sender: 'bot', timestamp: new Date().toISOString() }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [pdfFile, setPdfFile] = useState<{ name: string; data: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState("");
    const [isGestureMode, setIsGestureMode] = useState(false);
    const [lastGesture, setLastGesture] = useState<string | null>(null);
    const [activeGestureInfo, setActiveGestureInfo] = useState<GestureDisplayInfo | null>(null);
    const [showGestureGuide, setShowGestureGuide] = useState(false);
    const [selectedGuideTab, setSelectedGuideTab] = useState("All");
    const [guideSearchQuery, setGuideSearchQuery] = useState("");
    const gestureCooldownRef = useRef(false);
    const isLoadingRef = useRef(false);
    const conversationIdRef = useRef<number | null>(null);
    const lastClassifyTime = useRef<number>(0);
    const handsRef = useRef<Hands | null>(null);
    const isGestureActiveRef = useRef<boolean>(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
    const cameraPositionRef = useRef({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteAllDialogOpen, setAllDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
    const [isConversationsLoading, setIsConversationsLoading] = useState(false);
    const [deletedConversation, setDeletedConversation] = useState<{ id: number, title: string, messages: any[] } | null>(null);
    const { token, isGuest, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - cameraPositionRef.current.x,
            y: e.clientY - cameraPositionRef.current.y
        };
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        dragStartRef.current = {
            x: touch.clientX - cameraPositionRef.current.x,
            y: touch.clientY - cameraPositionRef.current.y
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        cameraPositionRef.current = { x: newX, y: newY };
        setCameraPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const newX = touch.clientX - dragStartRef.current.x;
        const newY = touch.clientY - dragStartRef.current.y;
        cameraPositionRef.current = { x: newX, y: newY };
        setCameraPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleTouchMoveWrapper = (e: TouchEvent) => handleTouchMove(e);
        const handleTouchEndWrapper = () => handleMouseUp();

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMoveWrapper, { passive: false });
            window.addEventListener('touchend', handleTouchEndWrapper);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMoveWrapper);
            window.removeEventListener('touchend', handleTouchEndWrapper);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMoveWrapper);
            window.removeEventListener('touchend', handleTouchEndWrapper);
        };
    }, [isDragging]);

    // Initialize Hands
    useEffect(() => {
        isGestureActiveRef.current = isGestureMode;
        if (isGestureMode) {
            setCameraPosition({ x: 0, y: 0 });
            cameraPositionRef.current = { x: 0, y: 0 };
        }

        if (!isGestureMode) {
            if (handsRef.current) {
                try {
                    handsRef.current.close();
                } catch (e) {
                    console.error("Error closing hands:", e);
                }
                handsRef.current = null;
            }
            return;
        }

        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        return () => {
            isGestureActiveRef.current = false;
            if (handsRef.current) {
                try {
                    handsRef.current.close();
                } catch (e) {
                    // Ignore errors during cleanup
                }
                handsRef.current = null;
            }
        };
    }, [isGestureMode]);

    const onResults = async (results: Results) => {
        if (!canvasRef.current || !results.multiHandLandmarks || !videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Dynamically resize canvas to match the video stream resolution
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const canvasCtx = canvas.getContext('2d')!;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Mirror the canvas context horizontally to match the mirrored webcam display
        canvasCtx.translate(canvas.width, 0);
        canvasCtx.scale(-1, 1);

        if (results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                // Use bright blue lines and white joint dots to match user request
                drawingUtils.drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00bfff', lineWidth: 3 });
                drawingUtils.drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 2, radius: 4 });
            }

            // Only classify if not on cooldown, and check every 100ms for instantaneous response
            const now = Date.now();
            if (!gestureCooldownRef.current && (now - lastClassifyTime.current > 100)) {
                lastClassifyTime.current = now;
                const localGesture = classifyGestureLocally(results.multiHandLandmarks);
                if (localGesture && localGesture !== 'none') {
                    handleGestureAction(localGesture);
                }
            }
        }
        canvasCtx.restore();
    };

    const handleGestureAction = (gesture: string) => {
        if (gestureCooldownRef.current) return;

        // Display the gesture information on the screen
        const gestureInfo = GESTURE_MAP[gesture];
        if (gestureInfo) {
            setActiveGestureInfo(gestureInfo);
            setLastGesture(gesture);
        }

        gestureCooldownRef.current = true;
        setTimeout(() => {
            gestureCooldownRef.current = false;
            setLastGesture(null);
            setActiveGestureInfo(null);
        }, 3000); // 3 second cooldown/display duration

        // Process any specific functional controls (Mute, Clear Chat)
        switch (gesture) {
            case 'peace':
                if (window.confirm("Clear chat?")) {
                    handleClearChat();
                }
                showToast("Gesture: Peace Sign! ✌️ (Clear Chat Triggered)", "info");
                break;
            case 'fist':
                window.speechSynthesis.cancel();
                setPlayingId(null);
                showToast("Gesture: Fist (Mute) ✊", "info");
                break;
            default:
                break;
        }
    };

    const handleClearChat = () => {
        setMessages([{ id: '1', text: "Hello! I'm MindMate. How can I help you today?", sender: 'bot', timestamp: new Date().toISOString() }]);
        setConversationId(null);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch conversations list on mount
    useEffect(() => {
        if (!isGuest && token) {
            fetchConversations();
        } else {
            // Load guest messages from localStorage if any
            const saved = localStorage.getItem('mindmate_guest_messages')
            if (saved) {
                setMessages(JSON.parse(saved))
            }
        }
        checkServerHealth();
    }, [isGuest, token]);

    // Check server health on mount and periodically
    useEffect(() => {
        checkServerHealth();
        const interval = setInterval(checkServerHealth, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const checkServerHealth = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch('http://localhost:8000/api/health', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                setServerStatus('online');
            } else {
                setServerStatus('offline');
            }
        } catch (error) {
            setServerStatus('offline');
        }
    };

    const fetchConversations = async () => {
        setIsConversationsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/conversations', {
                headers: {
                    'Authorization': `Bearer ${token} `
                }
            });
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            } else if (response.status === 401) {
                logout();
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setIsConversationsLoading(false);
        }
    };

    const loadConversation = async (id: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/conversations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setConversationId(data.conversation.id);
                const historyMessages = data.messages.map((m: any) => ({
                    id: m.id.toString(),
                    text: m.content,
                    sender: m.sender,
                    image: m.image_path,
                    timestamp: m.timestamp
                }));
                setMessages(historyMessages);
            } else if (response.status === 401) {
                logout();
            }
        } catch (error) {
            console.error("Error loading conversation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewChat = () => {
        setConversationId(null);
        setMessages([{ id: 'welcome', text: 'Hello! I am MindMate, your AI wellness assistant. How are you feeling today?', sender: 'bot' }]);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        setInputValue("");
        setCapturedImage(null);
        if (isGuest) {
            localStorage.removeItem('mindmate_guest_messages')
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        showToast(
            "Copied!",
            "success"
        );
    };

    const handleTTS = (text: string, id: string) => {
        if (playingId === id) {
            window.speechSynthesis.cancel();
            setPlayingId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlayingId(null);
        setPlayingId(id);
        window.speechSynthesis.speak(utterance);
    };

    const handleExport = () => {
        const content = messages.map(m => `[${m.sender === 'user' ? 'User' : 'MindMate'}] (${m.timestamp || new Date().toISOString()}): ${m.text}`).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmate-chat-${conversationId || 'new'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(
            "Exported!",
            "success"
        );
    };

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [conversations, searchQuery]);

    const filteredMessages = useMemo(() => {
        if (!chatSearchQuery.trim()) return messages;
        return messages.filter(m => m.text.toLowerCase().includes(chatSearchQuery.toLowerCase()));
    }, [messages, chatSearchQuery]);

    const handleDeleteConversation = (id: number) => {
        setConversationToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!conversationToDelete) return;

        const convToDelete = conversations.find(c => c.id === conversationToDelete);

        try {
            const response = await fetch(`http://localhost:8000/api/conversations/${conversationToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setConversations(prev => prev.filter(c => c.id !== conversationToDelete));

                if (conversationId === conversationToDelete) {
                    startNewChat();
                }
                setDeletedConversation({ id: convToDelete!.id, title: convToDelete!.title, messages: [] }); // Store for undo
                // Show success toast with undo option
                showToast(
                    `"${convToDelete?.title}" deleted`,
                    'success',
                    5000,
                    {
                        label: 'Undo',
                        onClick: handleUndoDelete
                    }
                );
            } else {
                showToast('Failed to delete conversation', 'error');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            showToast('Error deleting conversation', 'error');
        } finally {
            setDeleteDialogOpen(false);
            setConversationToDelete(null);
        }
    };

    const confirmDeleteAll = async () => {
        try {
            // Sequential deletion as backend might not have bulk delete
            const deletePromises = conversations.map(conv =>
                fetch(`http://localhost:8000/api/conversations/${conv.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );

            await Promise.all(deletePromises);
            setConversations([]);
            startNewChat();
            showToast('All conversations deleted', 'success');
        } catch (error) {
            console.error('Error deleting all conversations:', error);
            showToast('Failed to delete all conversations', 'error');
        } finally {
            setAllDeleteDialogOpen(false);
        }
    };

    const handleUndoDelete = async () => {
        if (!deletedConversation) return;

        try {
            const response = await fetch('http://localhost:8000/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: deletedConversation.title,
                    is_restored: true
                })
            });

            if (response.ok) {
                fetchConversations();
                showToast('Conversation restored', 'success');
            }
        } catch (error) {
            console.error('Error restoring conversation:', error);
            showToast('Failed to restore conversation', 'error');
        } finally {
            setDeletedConversation(null);
        }
    };

    const capture = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setShowCamera(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file is an image or PDF
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            showToast('Please select an image or PDF file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (file.type === 'application/pdf') {
                setPdfFile({ name: file.name, data: reader.result as string });
                setCapturedImage(null);
            } else {
                setCapturedImage(reader.result as string);
                setPdfFile(null);
            }
        };
        reader.readAsDataURL(file);

        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
        e?.preventDefault();
        if (isLoadingRef.current) return;

        const textToSend = overrideText !== undefined ? overrideText : inputValue;
        if (!textToSend.trim() && !capturedImage) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: 'user',
            image: capturedImage || undefined,
            pdf: pdfFile || undefined
        };

        // Check for local response first to bypass API/AI call completely
        const localReply = getLocalResponse(userMsg.text);
        if (localReply) {
            const botMsgId = (Date.now() + 1).toString();
            const botMsg: Message = {
                id: botMsgId,
                text: localReply,
                sender: 'bot'
            };
            setMessages(prev => [...prev, userMsg, botMsg]);
            setInputValue("");
            setCapturedImage(null);
            setPdfFile(null);
            setIsLoading(false);
            isLoadingRef.current = false;

            if (isGuest) {
                setMessages(prev => {
                    localStorage.setItem('mindmate_guest_messages', JSON.stringify(prev));
                    return prev;
                });
            }
            return;
        }

        const botMsgId = (Date.now() + 1).toString();
        const instantResponseEnabled = localStorage.getItem('mindmate_immediate_response') === 'true';

        // Add user message, and placeholder bot message if setting is enabled
        if (instantResponseEnabled) {
            const botMsg: Message = {
                id: botMsgId,
                text: "Reflecting on your message...",
                sender: 'bot'
            };
            setMessages(prev => [...prev, userMsg, botMsg]);
        } else {
            setMessages(prev => [...prev, userMsg]);
        }
        setInputValue("");
        setCapturedImage(null);
        setPdfFile(null);
        if (!instantResponseEnabled) {
            setIsLoading(true);
        }
        isLoadingRef.current = true;

        try {
            const headers: any = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: userMsg.text,
                    image: userMsg.image,
                    pdf: userMsg.pdf?.data,
                    conversationId: conversationIdRef.current,
                    history: isGuest ? messages : [],
                    stream: true
                }),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    logout();
                    alert("Session expired. Please login again.");
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Network response was not ok');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let accumulatedText = "";
            let botMessageCreated = instantResponseEnabled;
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                    try {
                        const data = JSON.parse(trimmedLine.slice(6));
                        if (data.error) throw new Error(data.error);

                        if (data.text) {
                            accumulatedText += data.text;

                            if (!botMessageCreated) {
                                botMessageCreated = true;
                                setIsLoading(false); // Hide loading dots
                                setMessages(prev => [...prev, {
                                    id: botMsgId,
                                    text: accumulatedText,
                                    sender: 'bot'
                                }]);
                            } else {
                                setMessages(prev => prev.map(msg =>
                                    msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg
                                ));
                            }
                        }

                        if (data.conversationId && !conversationIdRef.current) {
                            conversationIdRef.current = data.conversationId;
                            setConversationId(data.conversationId);
                            fetchConversations();
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk:", e);
                    }
                }
            }

            if (!accumulatedText) {
                throw new Error("No response received from the AI model.");
            }

            if (isGuest) {
                setMessages(prev => {
                    localStorage.setItem('mindmate_guest_messages', JSON.stringify(prev));
                    return prev;
                });
            }

        } catch (error: any) {
            console.error("Error sending message:", error);

            // Determine error type for better user feedback
            let errorMsgText = "";
            let isConnectionError = false;

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                // Network error - server not reachable
                isConnectionError = true;
                errorMsgText = "⚠️ **Unable to connect to the server**\n\nThe backend server appears to be offline. Please:\n\n1. Open a new terminal\n2. Navigate to your MindMate folder\n3. Run `start-backend.bat` (or `start-backend.ps1` for PowerShell)\n\nOr use `start-all.bat` to start both services automatically.";
                setServerStatus('offline');
            } else if (error.message.includes('abort')) {
                errorMsgText = "⏱️ **Request timed out**\n\nThe server took too long to respond. Please try again.";
            } else {
                errorMsgText = `❌ **Error**: ${error.message || 'An unexpected error occurred'}\n\nPlease try again or check the console for details.`;
            }

            setMessages(prev => {
                const botMsgExists = prev.some(m => m.id === botMsgId);
                if (botMsgExists) {
                    return prev.map(msg => msg.id === botMsgId ? { ...msg, text: errorMsgText } : msg);
                } else {
                    return [...prev, { id: botMsgId, text: errorMsgText, sender: 'bot' }];
                }
            });

            // Retry connection check
            if (isConnectionError) {
                setTimeout(checkServerHealth, 2000);
            }
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            window.speechSynthesis.cancel();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];

                // Only process results with good confidence
                if (result.isFinal && result[0].confidence > 0.7) {
                    finalTranscript += result[0].transcript;
                }
            }

            // Replace the input value instead of appending to prevent repetition
            if (finalTranscript) {
                setInputValue(finalTranscript.trim());
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'no-speech') {
                alert('No speech detected. Please try again.');
            } else if (event.error === 'audio-capture') {
                alert('No microphone found. Please check your microphone.');
            } else if (event.error === 'not-allowed') {
                alert('Microphone permission denied.');
            }
        };

        recognition.start();
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-8rem)]">
            {/* Sidebar Toggle Button (Mobile) */}
            <Button
                variant="ghost"
                size="sm"
                className="md:hidden absolute top-4 left-4 z-[60] bg-zinc-900/50 backdrop-blur"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <History className="size-4" />
            </Button>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="hidden md:flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shrink-0"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <History className="size-4 text-purple-400" />
                                Chat History
                            </h3>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsSidebarOpen(false)}>
                                <ChevronLeft className="size-4" />
                            </Button>
                        </div>

                        <div className="p-4 space-y-3">
                            <Button
                                onClick={startNewChat}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white gap-2 justify-start font-medium h-11"
                            >
                                <MessageSquarePlus className="size-4 text-purple-400" />
                                New Chat
                            </Button>

                            <div className="relative group/search">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 group-focus-within/search:text-purple-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search history..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-white/10 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                                    >
                                        <X className="size-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {isConversationsLoading ? (
                                <div className="p-4 space-y-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex gap-3">
                                            <Skeleton circle width={24} height={24} />
                                            <div className="space-y-1.5 flex-1">
                                                <Skeleton width="80%" height={12} />
                                                <Skeleton width="40%" height={8} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {filteredConversations.map((conv) => (
                                        <div key={conv.id} className="group relative">
                                            <button
                                                onClick={() => loadConversation(conv.id)}
                                                className={`w-full p-3 text-left rounded-2xl transition-all flex flex-col gap-1 ${conversationId === conv.id
                                                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white'
                                                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <MessagesSquare className={`size-3.5 ${conversationId === conv.id ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                                                    <span className="text-sm font-medium truncate pr-6">{conv.title}</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-600 pl-5">
                                                    {new Date(conv.created_at).toLocaleDateString()}
                                                </span>
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl z-20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteConversation(conv.id);
                                                }}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                    {!isGuest && conversations.length === 0 && (
                                        <div className="p-8 text-center">
                                            <p className="text-xs text-zinc-500">No history yet</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {isGuest && (
                                <div className="p-6 text-center space-y-4">
                                    <MessagesSquare className="size-8 text-zinc-600 mx-auto" />
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        Sign in to save your conversation history permanently across devices.
                                    </p>
                                    <Button
                                        onClick={() => navigate("/login")}
                                        className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs py-2"
                                    >
                                        Log In / Sign Up
                                    </Button>
                                </div>
                            )}
                        </div>

                        {!isGuest && conversations.length > 0 && (
                            <div className="p-4 border-t border-white/5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAllDeleteDialogOpen(true)}
                                    className="w-full text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-colors gap-2 justify-center text-xs"
                                >
                                    <Trash2 className="size-3.5" />
                                    Delete All History
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!isSidebarOpen && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex absolute mt-4 ml-[-1rem] z-50 bg-zinc-900/50 backdrop-blur rounded-full border border-white/10 hover:bg-white/10"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <ChevronRight className="size-4" />
                </Button>
            )}

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col relative overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl">
                {/* Camera Overlay */}
                <AnimatePresence>
                    {showCamera && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="flex justify-between items-center p-4 border-b border-white/10">
                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                        <Camera className="size-4 text-purple-400" />
                                        Take Photo
                                    </h3>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full" onClick={() => setShowCamera(false)}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video ring-1 ring-white/10">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium" onClick={capture}>
                                        Capture Image
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Cpu className="size-6 text-white" />
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 size-3 border-2 border-zinc-900 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' :
                                serverStatus === 'offline' ? 'bg-red-500' :
                                    'bg-yellow-500 animate-pulse'
                                }`} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                                MindMate
                                <Sparkles className="size-3 text-purple-400" />
                            </h2>
                            <p className={`text-xs font-medium flex items-center gap-1.5 ${serverStatus === 'online' ? 'text-green-400' :
                                serverStatus === 'offline' ? 'text-red-400' :
                                    'text-yellow-400'
                                }`}>
                                AI Assistant •
                                {serverStatus === 'online' && ' Online'}
                                {serverStatus === 'offline' && (
                                    <>
                                        <WifiOff className="size-3" />
                                        Server Offline
                                    </>
                                )}
                                {serverStatus === 'checking' && ' Checking...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsGestureMode(!isGestureMode)}
                            className={`h-8 w-8 p-0 rounded-full transition-colors ${isGestureMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                            title="Gesture Mode (Hands-free)"
                        >
                            <Hand className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowGestureGuide(true);
                                setSelectedGuideTab("All");
                                setGuideSearchQuery("");
                            }}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Gesture Reference Guide"
                        >
                            <HelpCircle className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={`h-8 w-8 p-0 rounded-full transition-colors ${isSearchOpen ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                            title="Search messages"
                        >
                            <Search className="size-4" />
                        </Button>
                        {messages.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExport}
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                title="Export conversation"
                            >
                                <Download className="size-4" />
                            </Button>
                        )}
                        {serverStatus === 'offline' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={checkServerHealth}
                                className="text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 gap-1.5"
                            >
                                <AlertCircle className="size-3" />
                                Retry
                            </Button>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative"
                    onScroll={handleScroll}
                >
                    <AnimatePresence>
                        {isSearchOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="sticky top-0 z-30 mb-4 px-2"
                            >
                                <div className="relative group/chatsearch">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within/chatsearch:text-purple-400" />
                                    <input
                                        type="text"
                                        placeholder="Search in this conversation..."
                                        value={chatSearchQuery}
                                        onChange={(e) => setChatSearchQuery(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    {chatSearchQuery && (
                                        <button
                                            onClick={() => setChatSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {showScrollButton && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-4 right-4 z-20"
                            >
                                <Button
                                    size="sm"
                                    onClick={scrollToBottom}
                                    className="rounded-full h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl border border-white/10"
                                >
                                    <ArrowDown className="size-5" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {isLoading && messages.length <= 1 ? (
                        <ChatSkeleton />
                    ) : (
                        <AnimatePresence initial={false}>
                            {filteredMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex gap-3 group ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user'
                                        ? 'bg-zinc-800 ring-1 ring-white/10'
                                        : 'bg-indigo-500/10 ring-1 ring-indigo-500/20'
                                        }`}>
                                        {msg.sender === 'user' ? (
                                            <User2 className="size-4 text-zinc-400" />
                                        ) : (
                                            <Cpu className="size-4 text-indigo-400" />
                                        )}
                                    </div>

                                    <div className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-4 rounded-2xl shadow-sm space-y-3 relative overflow-hidden ${msg.sender === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none'
                                            : 'bg-white/5 backdrop-blur-md border border-white/5 text-zinc-100 rounded-tl-none'
                                            }`}>
                                            {msg.sender === 'user' && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                            )}

                                            {msg.image && (
                                                <div className="relative rounded-lg overflow-hidden border border-white/10">
                                                    <img src={msg.image} alt="Uploaded" className="max-w-full h-auto" />
                                                </div>
                                            )}

                                            <div className={`text-sm leading-relaxed prose dark:prose-invert max-w-none ${msg.sender === 'user'
                                                ? 'prose-p:text-white prose-headings:text-white prose-li:text-white prose-strong:text-white prose-ol:text-white prose-ul:text-white'
                                                : 'prose-p:text-zinc-200 prose-headings:text-zinc-100 prose-li:text-zinc-200 prose-strong:text-zinc-200 prose-ol:text-zinc-200 prose-ul:text-zinc-200'
                                                }`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code({ node, className, children, ...props }) {
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            const { ref, ...rest } = props as any;
                                                            return match ? (
                                                                <SyntaxHighlighter
                                                                    style={vscDarkPlus as any}
                                                                    language={match[1]}
                                                                    PreTag="div"
                                                                    className="rounded-lg my-2 scrollbar-thin overflow-hidden"
                                                                    {...rest}
                                                                >
                                                                    {String(children).replace(/\n$/, '')}
                                                                </SyntaxHighlighter>
                                                            ) : (
                                                                <code className={`${className} bg-white/10 px-1 rounded`} {...rest}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>

                                            <div className={`flex items-center gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <button
                                                    onClick={() => handleCopy(msg.text, msg.id)}
                                                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-white"
                                                    title="Copy message"
                                                >
                                                    {copiedId === msg.id ? <Check className="size-3" /> : <Copy className="size-3" />}
                                                </button>
                                                {msg.sender === 'bot' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleTTS(msg.text, msg.id)}
                                                            className={`p-1 hover:bg-white/10 rounded-md transition-colors ${playingId === msg.id ? 'text-indigo-400' : 'text-white/50 hover:text-white'}`}
                                                            title="Read aloud"
                                                        >
                                                            <Volume2 className={`size-3 ${playingId === msg.id ? 'animate-pulse' : ''}`} />
                                                        </button>
                                                        <button
                                                            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-green-400"
                                                            title="Helpful"
                                                        >
                                                            <ThumbsUp className="size-3" />
                                                        </button>
                                                        <button
                                                            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-red-400"
                                                            title="Not helpful"
                                                        >
                                                            <ThumbsDown className="size-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-medium px-1">
                                            {msg.timestamp
                                                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            <div className="size-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 ring-1 ring-indigo-500/20">
                                <Cpu className="size-4 text-indigo-400" />
                            </div>
                            <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 pt-2">
                    <div className="relative">
                        {isGestureMode && (
                            <div className="absolute bottom-full mb-2 right-0 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 backdrop-blur-md rounded-full border border-indigo-500/20 shadow-lg animate-in fade-in slide-in-from-right-2">
                                <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Gestures Active</span>
                                {lastGesture && (
                                    <div className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded-md animate-bounce">
                                        {lastGesture.replace('_', ' ')}
                                    </div>
                                )}
                            </div>
                        )}
                        {capturedImage && (
                            <div className="absolute bottom-full mb-2 left-0 p-2 bg-zinc-900/90 backdrop-blur rounded-xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden ring-1 ring-white/10 group">
                                    <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setCapturedImage(null)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {pdfFile && (
                            <div className="absolute bottom-full mb-2 left-0 p-3 bg-zinc-900/90 backdrop-blur rounded-xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                                    <Paperclip className="size-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white truncate max-w-[150px]">{pdfFile.name}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter font-bold">PDF Document</p>
                                </div>
                                <button
                                    onClick={() => setPdfFile(null)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        <form
                            onSubmit={handleSend}
                            className="relative flex items-end gap-2 bg-zinc-900/40 backdrop-blur-md border border-white/10 p-2 rounded-3xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-zinc-900/60"
                        >
                            <div className="flex items-center gap-1 self-center pl-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-9 w-9 p-0 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors"
                                >
                                    <Plus className="size-5" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCamera(true)}
                                    className="h-9 w-9 p-0 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-full transition-colors"
                                >
                                    <Camera className="size-5" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleListening}
                                    className={`h-9 w-9 p-0 rounded-full transition-all duration-300 ${isListening
                                        ? "bg-red-500/20 text-red-500 animate-pulse"
                                        : "text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                                        }`}
                                >
                                    {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                                </Button>
                            </div>

                            <input
                                className="flex-1 bg-transparent border-none h-12 py-3 px-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0 min-w-0"
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isLoading}
                            />

                            <Button
                                id="chat-send-btn"
                                type="submit"
                                disabled={isLoading || (!inputValue.trim() && !capturedImage)}
                                className="h-10 w-10 p-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg self-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                            >
                                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4 ml-0.5" />}
                            </Button>
                        </form>
                    </div>
                </div>
            </Card>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Conversation"
                description={`Are you sure you want to delete "${conversations.find(c => c.id === conversationToDelete)?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Delete All Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteAllDialogOpen}
                onClose={() => setAllDeleteDialogOpen(false)}
                onConfirm={confirmDeleteAll}
                title="Clear Chat History"
                description="Are you absolutely sure you want to delete all your conversations? This action is permanent and cannot be undone."
                confirmText="Delete Everything"
                cancelText="Keep My History"
                variant="danger"
            />

            {/* Visible Webcam & Canvas for Gestures */}
            {isGestureMode && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none opacity-100">
                    <div 
                        style={{
                            transform: `translate(${cameraPosition.x}px, ${cameraPosition.y}px)`
                        }}
                        className={`relative w-[480px] h-[360px] md:w-[640px] md:h-[480px] rounded-2xl overflow-hidden border-4 border-indigo-500/60 shadow-[0_0_50px_rgba(99,102,241,0.4)] bg-black/95 backdrop-blur-md pointer-events-auto select-none transition-shadow ${isDragging ? 'cursor-grabbing shadow-[0_0_70px_rgba(99,102,241,0.6)] border-indigo-400' : 'cursor-grab hover:border-indigo-400/80'}`}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsGestureMode(false)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="absolute top-4 right-4 z-[60] bg-black/60 hover:bg-black/80 border border-white/10 text-white p-2 rounded-full hover:scale-105 transition-all shadow-md pointer-events-auto cursor-pointer flex items-center justify-center"
                            title="Close Gesture Mode"
                        >
                            <X className="size-4" />
                        </button>
                        <Webcam
                            mirrored
                            onUserMedia={() => {
                                const processVideo = async () => {
                                    if (videoRef.current && handsRef.current && isGestureActiveRef.current) {
                                        try {
                                            await handsRef.current.send({ image: videoRef.current });
                                        } catch (e: any) {
                                            if (e?.message?.includes('already deleted')) {
                                                console.warn("Hands instance was deleted during processing.");
                                                return;
                                            }
                                            console.error("Hands detection error:", e);
                                        }
                                        if (isGestureActiveRef.current) {
                                            requestAnimationFrame(processVideo);
                                        }
                                    }
                                };
                                requestAnimationFrame(processVideo);
                            }}
                            ref={(webcam) => {
                                if (webcam) {
                                    videoRef.current = webcam.video;
                                }
                            }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        
                        {/* Premium Visual Gesture HUD Overlay */}
                        <AnimatePresence>
                            {activeGestureInfo && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 15 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-zinc-950/90 border border-indigo-500/40 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.7)] pointer-events-none text-left min-w-[280px] max-w-[340px]"
                                >
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-3xl shrink-0 shadow-inner">
                                        {activeGestureInfo.emoji}
                                    </div>
                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black tracking-wider text-white uppercase truncate">
                                                {activeGestureInfo.name}
                                            </span>
                                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                                                {activeGestureInfo.category}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-300 font-medium leading-tight">
                                            {activeGestureInfo.meaning}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
            {/* Gesture Guide Modal */}
            <AnimatePresence>
                {showGestureGuide && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-zinc-950 border border-zinc-800/80 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowGestureGuide(false)}
                                className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-zinc-800"
                            >
                                <X className="size-5" />
                            </button>

                            {/* Header */}
                            <div className="p-6 border-b border-zinc-850 shrink-0">
                                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                    <Sparkles className="size-5 text-indigo-400" />
                                    Gesture Reference Guide
                                </h3>
                                <p className="text-xs text-zinc-450 mt-1 leading-relaxed">
                                    MindMate detects hand gestures locally in real-time. Simply turn on Gesture Mode, point your camera, and perform any of the shapes below!
                                </p>

                                {/* Tabs & Search */}
                                <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                                    {/* Tabs */}
                                    <div className="flex gap-1 bg-zinc-900 border border-zinc-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto shrink-0">
                                        {['All', 'Positive', 'Negative', 'Neutral', 'Situational'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setSelectedGuideTab(tab)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                                    selectedGuideTab === tab
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'text-zinc-400 hover:text-white'
                                                }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Search Bar */}
                                    <div className="relative w-full sm:w-60">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
                                        <input
                                            type="text"
                                            placeholder="Search gestures..."
                                            value={guideSearchQuery}
                                            onChange={(e) => setGuideSearchQuery(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Gesture List Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-2 max-h-[50vh] scrollbar-thin scrollbar-thumb-white/10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(GESTURE_MAP)
                                        .filter(([, val]) => {
                                            const matchesTab = selectedGuideTab === 'All' || val.category === selectedGuideTab;
                                            const matchesSearch = val.name.toLowerCase().includes(guideSearchQuery.toLowerCase()) ||
                                                val.meaning.toLowerCase().includes(guideSearchQuery.toLowerCase());
                                            return matchesTab && matchesSearch;
                                        })
                                        .map(([key, val]) => (
                                            <div
                                                key={key}
                                                className="flex gap-3.5 p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/60 hover:bg-zinc-900/60 transition-all group"
                                            >
                                                <div className="w-11 h-11 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                                                    {val.emoji}
                                                </div>
                                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-white leading-none">
                                                            {val.name}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase rounded ${
                                                            val.category === 'Positive' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                            val.category === 'Negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            val.category === 'Neutral' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                            {val.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-400 leading-snug mt-1">
                                                        {val.meaning}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
