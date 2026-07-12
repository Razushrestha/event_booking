import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    email: string
    name: string
    role?: string
    avatar?: string
    [key: string]: any // Allow additional user properties
}

interface AuthState {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    refreshToken: string | null
    stateLogin: (userData: User, token: string, refreshToken?: string | null) => void
    logout: () => void
    updateUser: (userData: Partial<User>) => void
    checkAuth: () => boolean
}

const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Auth state
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,

            // Actions
            stateLogin: (userData: User, token: string, refreshToken: string | null = null) => {
                if (refreshToken) {
                    localStorage.setItem("refreshToken", refreshToken);
                }

                set({
                    isAuthenticated: true,
                    user: userData,
                    token: token,
                    refreshToken,
                })
            },

            logout: () => {
                set({
                    isAuthenticated: false,
                    user: null,
                    token: null,
                    refreshToken: null,
                })
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')
            },

            // Update user data
            updateUser: (userData: Partial<User>) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null
                }))
            },

            // Check if user is authenticated
            checkAuth: (): boolean => {
                const { token } = get()
                return !!token && get().isAuthenticated
            }
        }),
        {
            name: 'auth-storage', // localStorage key
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
            })
        }
    )
)

export default useAuthStore