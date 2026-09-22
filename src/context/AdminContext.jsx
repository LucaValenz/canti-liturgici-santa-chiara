import { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext()
const ADMIN_STORAGE_KEY = 'canti_admin_auth'
const ADMIN_PIN = '1311'

export function AdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)

    useEffect(() => {
        const savedAuth = localStorage.getItem(ADMIN_STORAGE_KEY)
        if (savedAuth === 'true') {
            setIsAdmin(true)
        }
    }, [])

    const loginWithPin = (enteredPin) => {
        if (enteredPin.trim() === ADMIN_PIN) {
            localStorage.setItem(ADMIN_STORAGE_KEY, 'true')
            setIsAdmin(true)
            setShowLoginModal(false)
            return { success: true }
        }
        return { success: false, error: 'PIN non corretto' }
    }

    const logout = () => {
        localStorage.removeItem(ADMIN_STORAGE_KEY)
        setIsAdmin(false)
    }

    return (
        <AdminContext.Provider
            value={{
                isAdmin,
                showLoginModal,
                setShowLoginModal,
                loginWithPin,
                logout,
            }}
        >
            {children}
        </AdminContext.Provider>
    )
}

export function useAdmin() {
    const context = useContext(AdminContext)
    if (!context) {
        throw new Error('useAdmin deve essere usato all\'interno di un AdminProvider')
    }
    return context
}