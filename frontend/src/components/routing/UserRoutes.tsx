import type { ReactNode, FC } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ENABLE_PROTECTION = true

interface ProtectedRouteProps {
    children: ReactNode
}

const UserRoutes: FC<ProtectedRouteProps> = ({ children }) => {
    const isAuth = useAuthStore().checkAuth()
    const { user } = useAuthStore()

    if (!ENABLE_PROTECTION || isAuth || user?.role === 'user') {
        return <>{children}</>
    }

    return <Navigate to="/login" replace />
}

export default UserRoutes
