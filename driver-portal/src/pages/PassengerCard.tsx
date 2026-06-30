import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CheckCircle, MapPin, Ticket,
  Phone, Bus, AlertCircle,
} from 'lucide-react'
import { boardPassenger, markNoShow, getSeats } from '../services/api'

interface ScanResult {
  boardingPassId: string
  passenger: {
    bookingId: string; travelerName: string; gender: string; age: number
    phone: string; seats: number; pickupLocation: string; assignedSeat: string; boardingStatus: string
    adults: number; children: number; photo?: string; paymentStatus?: string; boardedAt?: string
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
          className="glass-card p-5"
        >
          <div className="flex items-center gap-4 mb-4">
            {p.photo ? (
              <img
                src={p.photo}
                alt={p.travelerName}
                className="w-14 h-14 rounded-2xl object-cover border border-teal-500/20 flex-shrink-0"
                onError={(e: any) => { e.target.src = ""; }} // Fallback to initial/emoji on broken image
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                {p.gender === 'Female' ? '👩' : p.gender === 'Male' ? '👨' : '🧑'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-lg leading-tight">{p.travelerName}</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="chip bg-blue-500/10 text-blue-400">{p.gender}</span>
                <span className="chip bg-violet-500/10 text-violet-400">Age {p.age}</span>
                <span className="chip bg-teal-500/10 text-teal-400 font-extrabold uppercase border border-teal-500/20">
                  {p.paymentStatus?.toUpperCase() === 'PAID' ? 'PAID' : 'PAID'}
                </span>
                <span className="chip bg-amber-500/10 text-amber-400">
                  {p.adults} Adult{p.adults > 1 ? 's' : ''}
                </span>
                {p.children > 0 && (
                  <span className="chip bg-pink-500/10 text-pink-400">
                    {p.children} Child{p.children > 1 ? 'ren' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1 flex items-center gap-1">
                <Ticket size={10} /> Booking ID
              </p>
              <p className="text-white font-bold text-sm font-mono">{p.bookingId}</p>
            </div>
            {p.pickupLocation && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1 flex items-center gap-1">
                  <MapPin size={10} /> Pickup
                </p>
                <p className="text-white font-bold text-sm truncate">{p.pickupLocation}</p>
              </div>
            )}
            {p.phone && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1 flex items-center gap-1">
                  <Phone size={10} /> Phone
                </p>
                <a href={`tel:${p.phone}`} className="text-teal-400 font-bold text-sm">{p.phone}</a>
              </div>
            )}
            {t.busNumber && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1 flex items-center gap-1">
                  <Bus size={10} /> Bus
                </p>
                <p className="text-white font-bold text-sm">{t.busNumber}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Seat selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="text-white font-bold text-sm mb-3">Assign Seat</p>

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
          disabled={loading}
          className="flex-2 flex-1 teal-btn"
        >
          {loading ? 'Boarding…' : selectedSeat ? `Board (Seat ${selectedSeat})` : 'Board Passenger'}
        </motion.button>
      </div>
    </div>
  )
}
