import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
    id: number
    username: string
    email: string
    bio?: string
    journey?: string
    location?: string
    created_at: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    isGuest: boolean
    login: (token: string, user: User) => void
    logout: () => void
    continueAsGuest: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isGuest, setIsGuest] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const verifySession = async () => {
            const savedToken = localStorage.getItem('mindmate_token')
            const savedUser = localStorage.getItem('mindmate_user')
            const savedIsGuest = localStorage.getItem('mindmate_is_guest') === 'true'

            if (savedToken && savedUser) {
                try {
                    const res = await fetch("http://localhost:8000/api/auth/me", {
                        headers: { "Authorization": `Bearer ${savedToken}` }
                    })
                    if (res.ok) {
                        const userData = await res.json()
                        setToken(savedToken)
                        setUser(userData)
                    } else {
                        // Token expired or invalid
                        logout()
                    }
                } catch (err) {
                    console.error("Failed to verify session:", err)
                    // If network fails, we'll keep the local state for now
                    setToken(savedToken)
                    setUser(JSON.parse(savedUser))
                }
            } else if (savedIsGuest) {
                setIsGuest(true)
            }
            setLoading(false)
        }

        verifySession()
    }, [])

    const login = (newToken: string, newUser: User) => {
        setToken(newToken)
        setUser(newUser)
        setIsGuest(false)
        localStorage.setItem('mindmate_token', newToken)
        localStorage.setItem('mindmate_user', JSON.stringify(newUser))
        localStorage.removeItem('mindmate_is_guest')
    }

    const continueAsGuest = () => {
        setIsGuest(true)
        setToken(null)
        setUser(null)
        localStorage.setItem('mindmate_is_guest', 'true')
        localStorage.removeItem('mindmate_token')
        localStorage.removeItem('mindmate_user')
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        setIsGuest(false)
        localStorage.removeItem('mindmate_token')
        localStorage.removeItem('mindmate_user')
        localStorage.removeItem('mindmate_is_guest')
    }

    return (
        <AuthContext.Provider value={{ user, token, isGuest, login, logout, continueAsGuest, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
