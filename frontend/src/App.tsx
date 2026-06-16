import { Routes, Route, Navigate } from "react-router-dom"
import RootLayout from "./layouts/RootLayout"
import HomePage from "./pages/HomePage"
import ChatInterface from "./features/chat/ChatInterface"
import SettingsPage from "./pages/SettingsPage"
import ProfilePage from "./pages/ProfilePage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import CalmCorner from "./pages/CalmCorner"
import GestureGame from "./pages/GestureGame"
import { ThemeProvider } from "./components/ThemeProvider"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ErrorBoundary from "./components/ErrorBoundary"
import { ToastProvider } from "./components/ui/Toast"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token, isGuest, loading } = useAuth()

    if (loading) return <div className="h-screen flex items-center justify-center text-muted-foreground font-medium">Loading session...</div>

    if (!token && !isGuest) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                    <ToastProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/" element={<RootLayout />}>
                                <Route index element={<HomePage />} />
                                <Route path="chat" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
                                <Route path="calm" element={<ProtectedRoute><CalmCorner /></ProtectedRoute>} />
                                <Route path="game" element={<ProtectedRoute><GestureGame /></ProtectedRoute>} />
                                <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                                <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                                <Route path="*" element={<div className="p-10 text-center text-muted-foreground">Page not found</div>} />
                            </Route>
                        </Routes>
                    </ToastProvider>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App
