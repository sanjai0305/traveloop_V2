import React, { createContext, useContext, useState } from 'react'

interface DriverInfo {
  id: string
  name: string
  email: string
  phone: string
  photo: string
  status: string
  licenseNumber?: string
  vehicleNumber?: string
}

interface AuthCtx {
  driver: DriverInfo | null
  token: string | null
  isLoggedIn: boolean
  login: (token: string, driver: DriverInfo) => void
  logout: () => void
}

const DriverAuthContext = createContext<AuthCtx>({
  driver: null, token: null, isLoggedIn: false,
  login: () => {}, logout: () => {},
})

export const DriverAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token,  setToken]  = useState<string | null>(() => localStorage.getItem('driver_token'))
  const [driver, setDriver] = useState<DriverInfo | null>(() => {
    const d = localStorage.getItem('driver_info')
    return d ? JSON.parse(d) : null
  })

  const login = (t: string, d: DriverInfo) => {
    localStorage.setItem('driver_token', t)
    localStorage.setItem('driver_info', JSON.stringify(d))
    setToken(t); setDriver(d)
  }

  const logout = () => {
    localStorage.removeItem('driver_token')
    localStorage.removeItem('driver_info')
    setToken(null); setDriver(null)
  }

  return (
    <DriverAuthContext.Provider value={{ driver, token, isLoggedIn: !!token, login, logout }}>
      {children}
    </DriverAuthContext.Provider>
  )
}

export const useDriverAuth = () => useContext(DriverAuthContext)
