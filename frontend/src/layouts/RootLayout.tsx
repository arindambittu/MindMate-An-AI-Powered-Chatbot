import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { Compass, MessagesSquare, Settings2, UserCircle, LogOut, Waves, Gamepad2 } from "lucide-react"
import { cn } from "../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/AuthContext"

import logo from "../assets/logo-3d.png"

export default function RootLayout() {
    const location = useLocation()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault()
        logout()
        navigate("/login")
    }

    const navItems = [
        { href: "/", label: "Dashboard", icon: Compass },
        { href: "/chat", label: "Chat", icon: MessagesSquare },
        { href: "/calm", label: "Calm Corner", icon: Waves },
        { href: "/game", label: "Gesture Game", icon: Gamepad2 },
        { href: "/profile", label: "Profile", icon: UserCircle },
        { href: "/settings", label: "Settings", icon: Settings2 },
    ]

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-2xl p-6 hidden md:flex flex-col relative z-20">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <img src={logo} alt="MindMate Logo" className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    </motion.div>
                    <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">MindMate</span>
                </div>

                <nav className="space-y-1.5 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="relative group block"
                            >
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative z-10",
                                        isActive
                                            ? "text-primary-foreground shadow-lg shadow-primary/20"
                                            : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-bg"
                                            className="absolute inset-0 bg-primary rounded-xl -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className={cn("size-5", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 group cursor-pointer overflow-hidden relative">
                        <Link to="/profile" className="absolute inset-0 z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="size-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px] relative z-20">
                            <div className="size-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                <UserCircle className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 relative z-20">
                            <p className="font-semibold text-sm truncate group-hover:text-white transition-colors">{user?.username || "Guest"}</p>
                            <p className="text-muted-foreground text-xs truncate">MindMate Member</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors relative z-30"
                            title="Logout"
                        >
                            <LogOut className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="container mx-auto p-6 md:p-10 max-w-6xl relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
