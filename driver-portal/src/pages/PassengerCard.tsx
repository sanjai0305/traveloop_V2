import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CheckCircle, AlertCircle,
} from 'lucide-react'
import { boardPassenger, markNoShow, getSeats } from '../services/api'

interface ScanResult {
  boardingPassId: string
  passenger: {
    bookingId: string; travelerName: string; gender: string; age: number
    phone: string; seats: number; pickupLocation: string; assignedSeat: string; boardingStatus: string
    adults: number; children: number; photo?: string; paymentStatus?: string; boardedAt?: string
    travellers?: any[]
    seatNumbers?: string[]
  }
  trip: { _id: string; title: string; busNumber: string; departureTime: string; destinations: string[] }
}

// Generate seat labels A1-A12, B1-B12 etc.
const genSeats = (totalSeats: number) => {
  const seats: string[] = []
  const rows = ['A', 'B', 'C', 'D', 'E', 'F']
  const seatsPerRow = 4
  let count = 0
  for (const row of rows) {
    for (let n = 1; n <= seatsPerRow; n++) {
      if (count >= totalSeats) break
      seats.push(`${row}${n}`)
      count++
    }
    if (count >= totalSeats) break
  }
  return seats
}

export default function PassengerCard() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const result    = location.state?.result as ScanResult | undefined

  const [selectedSeat, setSelectedSeat] = useState(result?.passenger?.assignedSeat || '')
  const [occupiedSeats, setOccupied]    = useState<{seat: string; status: string}[]>([])
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(result?.passenger?.boardingStatus === 'Boarded' || result?.passenger?.boardingStatus === 'boarded')
  const [error,    setError]    = useState('')

  const seatList = genSeats(40) // default 40 seats

  useEffect(() => {
    if (!result) {
      navigate('/', { replace: true })
      return
    }
    // Fetch currently occupied seats for this trip
    if (result.trip && result.trip._id) {
      getSeats(result.trip._id)
        .then(res => {
          if (res.data.success) {
            setOccupied(res.data.occupiedSeats || [])
          }
        })
        .catch(() => {})
    }
  }, [result, navigate])

  const isOccupied = (s: string) => occupiedSeats.some(o => o.seat === s)

  const handleBoard = async () => {
    if (!result) return
    setLoading(true); setError('')
    try {
      await boardPassenger(result.passenger.bookingId, selectedSeat, result.boardingPassId)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark as boarded')
    } finally { setLoading(false) }
  }

  const handleNoShow = async () => {
    if (!result) return
    await markNoShow(result.passenger.bookingId)
    navigate('/')
  }

  if (!result) return null

  const p = result.passenger
  const t = result.trip

  if (success) {
    const boardingTime = p.boardedAt ? new Date(p.boardedAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4 gap-6">
        <div className="bg-emerald-500 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={18} />
          <span>Passenger boarded successfully</span>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"
        >
          <CheckCircle size={48} className="text-emerald-400" />
        </motion.div>
        <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6 max-w-xs w-full space-y-3">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Passenger Name</p>
            <p className="text-white text-lg font-extrabold">{p.travelerName}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Seat Number</p>
            <p className="text-teal-400 text-xl font-black">Seat {selectedSeat || p.assignedSeat || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Boarding Time</p>
            <p className="text-white font-mono font-bold">{boardingTime}</p>
          </div>
        </div>
        <button onClick={() => navigate('/scan')} className="teal-btn px-10">
          Scan Next Passenger
        </button>
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-32"
      style={{ background: 'radial-gradient(ellipse at top, #0d1f30 0%, #0B1325 70%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={() => navigate('/scan')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-extrabold text-white text-lg">Passenger Verified</h1>
        <div className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <CheckCircle size={11} /> Valid
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">

        {/* Passenger info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px' }}
        >
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Passenger</p>
              <p className="text-white font-extrabold text-lg mt-0.5">{p.travelerName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Seat</p>
              <p className="text-teal-400 font-black text-lg mt-0.5">{selectedSeat || p.assignedSeat || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Payment</p>
              <p className="text-emerald-400 font-extrabold text-sm flex items-center gap-1 mt-0.5">
                {(p.paymentStatus || 'PAID').toUpperCase()} 🟢
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Passengers</p>
              <p className="text-white font-bold text-sm mt-0.5">{p.seats || 1}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Departure</p>
              <p className="text-white font-bold text-sm mt-0.5">{t.departureTime || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Trip</p>
              <p className="text-white font-bold text-sm mt-0.5 truncate">{t.title}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Vehicle</p>
              <p className="text-white font-mono font-bold text-sm mt-0.5">{t.busNumber || '—'}</p>
            </div>
            <div className="col-span-2 border-t border-white/10 pt-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Status</p>
              <p className="text-teal-400 font-extrabold text-sm mt-0.5">
                {(success || p.boardingStatus === 'Boarded' || p.boardingStatus === 'boarded') ? 'BOARDED' : 'PENDING'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Passenger List */}
        {((result as any).passengers || p.travellers || []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px' }}
          >
            <p className="text-white font-bold text-sm border-b border-white/5 pb-2">Passenger List</p>
            <div className="space-y-2">
              {((result as any).passengers || p.travellers || []).map((pass: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs text-slate-300">
                  <span>{idx + 1}. {pass.name} ({pass.gender || '—'})</span>
                  <span className="text-teal-400 font-mono font-bold">
                    {result.passenger.assignedSeat || result.passenger.seatNumbers?.[idx] ? `Seat ${result.passenger.assignedSeat || result.passenger.seatNumbers?.[idx]}` : `Seat A${12 + idx}`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Seat selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <p className="text-white font-bold text-sm mb-3">Assign / Change Seat</p>

          {/* Legend */}
          <div className="flex gap-3 mb-4">
            {[
              { color: 'bg-teal-500', label: 'Available' },
              { color: 'bg-blue-500',  label: 'Selected' },
              { color: 'bg-rose-500',  label: 'Occupied' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                <span className="text-slate-400 text-[10px] font-semibold">{l.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {seatList.map(seat => {
              const occupied = isOccupied(seat)
              const selected = selectedSeat === seat
              return (
                <button
                  key={seat}
                  disabled={occupied}
                  onClick={() => !occupied && setSelectedSeat(seat)}
                  className={`h-10 rounded-lg text-xs font-bold transition-all ${
                    occupied  ? 'bg-rose-500/20 text-rose-400 cursor-not-allowed'
                    : selected ? 'text-white shadow-brand'
                    : 'bg-white/5 text-slate-400 hover:bg-teal-500/10 hover:text-teal-400'
                  }`}
                  style={selected ? { background: 'linear-gradient(135deg,#14B8A6,#0D9488)' } : {}}
                >
                  {seat}
                </button>
              )
            })}
          </div>
        </motion.div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {/* Bottom CTAs */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-dark-900/90 backdrop-blur-md border-t border-white/5 flex gap-3">
        <button
          onClick={handleNoShow}
          className="flex-1 py-3 rounded-2xl border border-rose-500/30 text-rose-400 font-bold text-sm hover:bg-rose-500/10 transition-colors"
        >
          No Show
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBoard}
          disabled={loading || success}
          className="flex-2 flex-1 teal-btn"
          style={success ? { background: '#1e293b', color: '#64748b', cursor: 'not-allowed' } : {}}
        >
          {loading ? 'Boarding…' : success ? 'Already Boarded' : 'Confirm Boarding'}
        </motion.button>
      </div>
    </div>
  )
}
