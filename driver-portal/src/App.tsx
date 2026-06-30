import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DriverAuthProvider, useDriverAuth } from './context/DriverAuthContext'
import Login    from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scanner  from './pages/Scanner'
import PassengerCard from './pages/PassengerCard'
import Manifest from './pages/Manifest'

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useDriverAuth()
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

const App = () => (
  <DriverAuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login"   element={<Login />} />
        <Route path="/"        element={<Protected><Dashboard /></Protected>} />
        <Route path="/scan"    element={<Protected><Scanner /></Protected>} />
        <Route path="/scan/result" element={<Protected><PassengerCard /></Protected>} />
        <Route path="/manifest/:tripId" element={<Protected><Manifest /></Protected>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </DriverAuthProvider>
)

export default App
