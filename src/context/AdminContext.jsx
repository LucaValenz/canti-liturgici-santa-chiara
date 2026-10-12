import { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext()
const ADMIN_STORAGE_KEY = 'canti_admin_auth'

// SHA-256 del PIN — il valore in chiaro non è più nel sorgente
const ADMIN_PIN_HASH = '7611f1a57f80b0a87b4178e2e5f16bafa30dd0d9947d99f953c091d8c96abd0e'

async function sha256(text) {
    const encoded = new TextEncoder().encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function AdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)

    useEffect(() => {
        const savedAuth = localStorage.getItem(ADMIN_STORAGE_KEY)
        if (savedAuth === 'true') {
            setIsAdmin(true)
        }
    }, [])

    const loginWithPin = async (enteredPin) => {
        const hash = await sha256(enteredPin.trim())
        if (hash === ADMIN_PIN_HASH) {
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