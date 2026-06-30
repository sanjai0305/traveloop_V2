import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Key, ArrowRight, Bus } from 'lucide-react'
import { sendOtp, verifyOtp } from '../services/api'
import { useDriverAuth } from '../context/DriverAuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useDriverAuth()

  const [step,     setStep]     = useState<'email' | 'otp'>('email')
  const [email,    setEmail]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await sendOtp(email.trim())
      setSuccess(res.data?.message || 'OTP sent successfully.')
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await verifyOtp(email.trim(), otp.trim())
      login(res.data.token, res.data.driver)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #0d2137 0%, #0B1325 60%)' }}>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 mb-10"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)' }}>
          <Bus size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Driver Portal</h1>
          <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-0.5">Traveloop</p>
        </div>
      </motion.div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: step === 'otp' ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-sm glass-card p-6"
      >
        {step === 'email' ? (
          <>
            <h2 className="text-lg font-bold text-white mb-1">Sign In</h2>
            <p className="text-slate-400 text-sm mb-6">Enter your registered driver email to receive a login OTP.</p>

            {error   && <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}
            {success && <div className="mb-4 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm">{success}</div>}

            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 input-field">
                <Mail size={16} className="text-slate-400 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your driver email"
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 text-sm"
                  required
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="teal-btn w-full"
              >
                {loading ? 'Sending…' : 'Send OTP'}
                <ArrowRight size={16} />
              </motion.button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white mb-1">Enter OTP</h2>
            <p className="text-slate-400 text-sm mb-6">6-digit code sent to <span className="text-teal-400 font-semibold">{email}</span></p>

            {error   && <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}
            {success && <div className="mb-4 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm">{success}</div>}

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 input-field">
                <Key size={16} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 text-sm tracking-widest"
                  required
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="teal-btn w-full"
              >
                {loading ? 'Verifying…' : 'Login'}
                <ArrowRight size={16} />
              </motion.button>

              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setOtp('') }}
                className="text-slate-400 text-sm text-center hover:text-teal-400 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          </>
        )}
      </motion.div>

      <p className="text-slate-600 text-xs mt-8 text-center">
        Driver accounts are created by your travel agency.<br />Contact your agency if you cannot log in.
      </p>
    </div>
  )
}
