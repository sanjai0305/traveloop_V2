import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, Clock, XCircle, Search } from 'lucide-react'
import { getManifest } from '../services/api'

interface Passenger {
  bookingId: string; travelerName: string; gender: string; age: number
  phone: string; seats: number; boardingStatus: string; assignedSeat: string; pickupLocation: string
}

const STATUS_MAP = {
  not_boarded: { icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Pending' },
  boarded:     { icon: CheckCircle,  color: 'text-emerald-400',bg: 'bg-emerald-500/10',label: 'Boarded' },
  no_show:     { icon: XCircle,      color: 'text-rose-400',   bg: 'bg-rose-500/10',   label: 'No Show' },
}

export default function Manifest() {
  const { tripId } = useParams()
  const navigate   = useNavigate()

  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [trip,       setTrip]       = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    if (!tripId) return
    getManifest(tripId).then(res => {
      setPassengers(res.data.passengers || [])
      setTrip(res.data.trip)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [tripId])

  const filtered = passengers.filter(p =>
    p.travelerName?.toLowerCase().includes(search.toLowerCase()) ||
    p.bookingId?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-dark-900 pb-8">

      <div className="flex items-center gap-3 p-4 pt-6 sticky top-0 bg-dark-900/95 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-white text-lg truncate">Passenger Manifest</h1>
          {trip && <p className="text-slate-400 text-xs truncate">{trip.title}</p>}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 input-field">
          <Search size={15} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or booking ID"
            className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 text-sm"
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
        {(['not_boarded','boarded','no_show'] as const).map(s => {
          const cfg = STATUS_MAP[s]
          const Icon = cfg.icon
          const count = passengers.filter(p => p.boardingStatus === s).length
          return (
            <div key={s} className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl ${cfg.bg} ${cfg.color}`}>
              <Icon size={13} />
              <span className="text-xs font-bold">{count} {cfg.label}</span>
            </div>
          )
        })}
      </div>

      <div className="px-4 flex flex-col gap-2">
        {loading
          ? [1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)
          : filtered.map((p, i) => {
              const cfg = STATUS_MAP[p.boardingStatus as keyof typeof STATUS_MAP] || STATUS_MAP.not_boarded
              const Icon = cfg.icon
              return (
                <motion.div
                  key={p.bookingId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{p.travelerName}</p>
                    <p className="text-slate-400 text-xs">{p.bookingId} · {p.gender} · Age {p.age}</p>
                    {p.assignedSeat && <p className="text-teal-400 text-xs font-semibold">Seat {p.assignedSeat}</p>}
                  </div>
                  <span className={`chip ${cfg.bg} ${cfg.color} flex-shrink-0 text-[10px]`}>{cfg.label}</span>
                </motion.div>
              )
            })
        }
      </div>
    </div>
  )
}
