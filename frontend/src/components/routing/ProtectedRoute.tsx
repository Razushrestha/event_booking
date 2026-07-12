import type { ReactNode, FC } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ENABLE_PROTECTION = true

interface ProtectedRouteProps {
    children: ReactNode
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
    const isAuth = useAuthStore().checkAuth()

    if (!ENABLE_PROTECTION || isAuth) {
        return <>{children}</>
    }

    return <Navigate to="/login" replace />
}

export default ProtectedRoute
