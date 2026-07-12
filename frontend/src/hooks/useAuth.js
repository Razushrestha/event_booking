// hooks/useAuth.js
import useAuthStore from '../store/authStore'

const useAuth = () => {
    const {
        isAuthenticated,
        user,
        token,
        login,
        logout,
        updateUser,
        checkAuth
    } = useAuthStore()

    return {
        isAuthenticated,
        user,
        token,
        login,
        logout,
        updateUser,
        checkAuth,
        isLoggedIn: checkAuth()
    }
}

export default useAuth