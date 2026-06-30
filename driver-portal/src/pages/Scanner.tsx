import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, QrCode, XCircle, RefreshCw } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { scanQr } from '../services/api'

export default function Scanner() {
  const navigate = useNavigate()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning]   = useState(false)
  const [error,    setError]      = useState('')
  const [loading,  setLoading]    = useState(false)

  const startScanner = async () => {
    if (scannerRef.current) return
    setError('')
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      setScanning(true)
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          await scanner.stop()
          scannerRef.current = null
          setScanning(false)
          handleScanned(decodedText)
        },
        () => {}
      )
    } catch (err: any) {
      setError('Camera access denied. Please allow camera permission.')
      setScanning(false)
    }
  }

  const handleScanned = async (qrToken: string) => {
    setLoading(true)
    try {
      const res = await scanQr(qrToken)
      if (res.data.success) {
        navigate('/scan/result', { state: { result: res.data, qrToken } })
      } else {
        setError(res.data.message || 'QR validation failed')
      }
    } catch (err: any) {
      const code = err.response?.data?.code;
      const backendMessage = err.response?.data?.message;
      const msgs: Record<string, string> = {
        INVALID_QR:      '❌ Invalid or tampered QR code.',
        ALREADY_BOARDED: backendMessage || '✅ Passenger already boarded.',
        WRONG_DRIVER:    '⚠️ This QR is for a different driver/trip.',
        WRONG_DATE:      '📅 QR is not valid for today.',
        BOOKING_NOT_FOUND:'🔍 Booking not found.',
      };
      setError(msgs[code] || backendMessage || 'Scan failed. Try again.');
    } finally { setLoading(false); }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch (_) {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    startScanner()
    return () => { stopScanner() }
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col"
      style={{ background: '#050d1a' }}>

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={() => { stopScanner(); navigate('/') }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-extrabold text-white text-lg">Scan Passenger QR</h1>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-4">

        {/* Scanner element */}
        <div id="qr-reader" className="w-full max-w-xs" />

        {/* Overlay frame */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner borders */}
              {[
                'top-0 left-0 border-t-2 border-l-2',
                'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2',
                'bottom-0 right-0 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-teal-400 rounded-sm ${cls}`} />
              ))}
              {/* Scan line */}
              <motion.div
                className="absolute left-2 right-2 h-0.5 bg-teal-400 shadow-brand"
                animate={{ top: ['10%', '85%', '10%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}

        {/* Loading spinner overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-900/80 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                className="w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-teal-400 font-bold">Validating QR…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
          >
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center">
              <XCircle size={36} className="text-rose-400" />
            </div>
            <p className="text-white font-bold text-center text-lg whitespace-pre-line">{error}</p>
            <button
              onClick={() => { setError(''); startScanner() }}
              className="teal-btn px-8"
            >
              <RefreshCw size={16} /> Scan Again
            </button>
          </motion.div>
        )}

        {/* Idle prompt */}
        {!scanning && !error && !loading && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(20,184,166,0.1)', border: '2px solid rgba(20,184,166,0.2)' }}>
              <QrCode size={36} className="text-teal-400" />
            </div>
            <p className="text-white font-bold text-lg">Camera starting…</p>
            <button onClick={startScanner} className="teal-btn">
              <RefreshCw size={16} /> Retry Camera
            </button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="px-6 pb-8 text-center">
        <p className="text-slate-500 text-xs">Point the camera at the passenger's QR code.<br />QR is valid only on the trip day.</p>
      </div>
    </div>
  )
}
