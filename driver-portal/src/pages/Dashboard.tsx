import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bus, Users, CheckCircle, Clock, XCircle, QrCode,
  MapPin, LogOut, List, TrendingUp,
  Bell, Send, X as XIcon,
} from 'lucide-react'
import { getDashboard, openBoarding, closeBoarding } from '../services/api'
import { useDriverAuth } from '../context/DriverAuthContext'

interface Stats { total: number; boarded: number; pending: number; noShow: number; occupancyPct: number }
interface Trip {
  _id: string; title: string; destinations: string[]; startDate: string
  departureTime: string; pickupLocation: string; dropPoint: string
  busNumber: string; busType: string; totalSeats: number
  boardingStatus?: string
  boardingOpenedAt?: string
  boardingClosesAt?: string
}
interface BoardLog { bookingId: string; travelerName: string; seatNumber: string; boardedAt: string; gender: string }

export default function Dashboard() {
  const navigate = useNavigate()
  const { driver, logout } = useDriverAuth()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [boardingLog, setBoardingLog] = useState<BoardLog[]>([])
  const [loading, setLoading] = useState(true)

  // ── NEW: Post Driver Update state
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateType, setUpdateType] = useState<'info' | 'alert' | 'delay' | 'location'>('info')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateSending, setUpdateSending] = useState(false)

  const handleOpenBoarding = async (tripId: string) => {
    try {
      setLoading(true)
      await openBoarding(tripId)
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to open boarding")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseBoarding = async (tripId: string) => {
    if (!confirm('Are you sure you want to close boarding? Travelers will no longer be able to generate QR passes.')) return
    try {
      setLoading(true)
      await closeBoarding(tripId)
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to close boarding')
    } finally {
      setLoading(false)
    }
  }

  // ── NEW: Post a driver update announcement
  const handlePostUpdate = async () => {
    if (!updateMessage.trim() || !trip) return
    setUpdateSending(true)
    try {
      const token = localStorage.getItem('driver_token') || localStorage.getItem('token') || '';
      const baseApiUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`) : 'https://traveloopv2.duckdns.org/api');
      const res = await fetch(`${baseApiUrl}/driver-updates/${trip._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: updateType,
          message: updateMessage.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUpdateMessage('')
        setShowUpdateModal(false)
        alert(`✅ Update posted! Travelers will see this now.`)
      } else {
        alert(data.message || 'Failed to post update')
      }
    } catch (err) {
      alert('Error posting update')
    } finally {
      setUpdateSending(false)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboard()
      setTrip(res.data.trip)
      setStats(res.data.stats)
      setBoardingLog(res.data.boardingLog || [])
    } catch (_) { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [fetchData])

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-dark-900 pb-24"
      style={{ background: 'radial-gradient(ellipse at top, #0d1f30 0%, #0B1325 70%)' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {driver?.photo
            ? <img src={driver.photo} alt={driver.name} className="w-10 h-10 rounded-full object-cover border-2 border-teal-500/30" />
            : <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-lg">🧑‍✈️</div>
          }
          <div>
            <p className="font-bold text-white text-sm leading-tight">{driver?.name || 'Driver'}</p>
            <p className="text-slate-400 text-xs">{driver?.vehicleNumber || driver?.licenseNumber || 'Driver Portal'}</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      <div className="px-4 flex flex-col gap-5">

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : !trip ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <div className="text-5xl mb-4">🚌</div>
            <p className="text-white font-bold text-lg">No trip today</p>
            <p className="text-slate-400 text-sm mt-1">You have no trips scheduled for today.</p>
          </motion.div>
        ) : (
          <>
            {/* ── Trip card ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-1" style={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)' }}>
                <p className="text-center text-white text-[10px] font-extrabold uppercase tracking-widest py-1">Today's Trip</p>
              </div>
              <div className="p-4">
                <h2 className="font-extrabold text-white text-lg leading-tight mb-1">{trip.title}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                  {(trip.destinations || [])[0] && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-teal-400" />
                      <span>{(trip.destinations || [])[0]}</span>
                    </div>
                  )}
                  {trip.departureTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-violet-400" />
                      <span>{trip.departureTime}</span>
                    </div>
                  )}
                  {trip.busNumber && (
                    <div className="flex items-center gap-1.5">
                      <Bus size={13} className="text-amber-400" />
                      <span>{trip.busNumber}</span>
                    </div>
                  )}
                </div>
                {trip.pickupLocation && (
                  <div className="mt-3 bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1">Pickup Point</p>
                    <p className="text-white text-sm font-semibold">{trip.pickupLocation}</p>
                  </div>
                )}

                {/* Boarding Action Controls */}
                <div className="mt-3 bg-white/5 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Boarding Status</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {trip.boardingStatus === "OPEN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450" /> Boarding Open
                          </span>
                        ) : trip.boardingStatus === "CLOSED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-455 border border-rose-500/30">
                            Boarding Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            Boarding Locked
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {trip.boardingStatus === "OPEN" ? (
                        <button
                          onClick={() => handleCloseBoarding(trip._id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          Close Boarding
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenBoarding(trip._id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <QrCode size={13} /> Unlock Boarding
                        </button>
                      )}
                    </div>
                  </div>

                  {trip.boardingStatus === "OPEN" && (
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2.5">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wide">Boarding Started</span>
                        <span className="text-slate-200 font-semibold">{trip.boardingOpenedAt ? new Date(trip.boardingOpenedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wide">Boarding Ends</span>
                        <span className="text-slate-200 font-semibold">{trip.boardingClosesAt ? new Date(trip.boardingClosesAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                      <div className="col-span-2 flex justify-between items-center bg-white/5 p-2 rounded-lg mt-1 border border-white/5">
                        <span className="text-slate-450">Checked In: <strong className="text-white font-extrabold">{stats?.boarded || 0} / {stats?.total || 0}</strong></span>
                        <span className="text-slate-450">Pending: <strong className="text-white font-extrabold">{stats?.pending || 0}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/manifest/${trip._id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    <List size={15} /> Manifest
                  </button>
                  <button
                    disabled={trip.boardingStatus !== "OPEN"}
                    onClick={() => navigate('/scan')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
                    style={
                      trip.boardingStatus === "OPEN"
                        ? { background: 'linear-gradient(135deg,#14B8A6,#0D9488)' }
                        : { background: '#1e293b', color: '#64748b', opacity: 0.5, cursor: 'not-allowed' }
                    }
                  >
                    <QrCode size={15} />
                    {trip.boardingStatus === "OPEN" ? "Scan QR" : "Unlock Boarding First"}
                  </button>
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-colors"
                  >
                    <Bell size={14} /> Post Update
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ── POST UPDATE MODAL ── */}
            <AnimatePresence>
              {showUpdateModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowUpdateModal(false)}
                >
                  <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-lg rounded-t-3xl p-5 pb-8"
                    style={{ background: 'linear-gradient(160deg,#0d1f30,#0B1325)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white font-bold text-base">Post Trip Update</p>
                      <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-white">
                        <XIcon size={18} />
                      </button>
                    </div>

                    <p className="text-slate-400 text-xs mb-3">Travelers will receive this immediately.</p>

                    {/* Type selector */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {(['info', 'alert', 'delay', 'location'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setUpdateType(t)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all capitalize ${updateType === t
                              ? t === 'alert' ? 'bg-amber-500 text-white border-amber-400'
                                : t === 'delay' ? 'bg-rose-500 text-white border-rose-400'
                                  : t === 'location' ? 'bg-green-500 text-white border-green-400'
                                    : 'bg-blue-500 text-white border-blue-400'
                              : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                        >
                          {t === 'info' ? '📋 Info'
                            : t === 'alert' ? '⚠️ Alert'
                              : t === 'delay' ? '⏰ Delay'
                                : '📍 Location'}
                        </button>
                      ))}
                    </div>

                    {/* Message */}
                    <textarea
                      value={updateMessage}
                      onChange={e => setUpdateMessage(e.target.value)}
                      placeholder={`Type your ${updateType} message here...`}
                      rows={3}
                      maxLength={500}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500/50 resize-none"
                    />
                    <p className="text-slate-500 text-[10px] text-right mt-1">{updateMessage.length}/500</p>

                    <button
                      onClick={handlePostUpdate}
                      disabled={!updateMessage.trim() || updateSending}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-40 transition-all"
                      style={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)' }}
                    >
                      <Send size={15} />
                      {updateSending ? 'Sending...' : 'Send to All Travelers'}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Stats grid ── */}
            {stats && (
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Boarding Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-400' },
                    { label: 'Boarded', value: stats.boarded, icon: CheckCircle, color: 'text-emerald-400' },
                    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
                    { label: 'No Show', value: stats.noShow, icon: XCircle, color: 'text-rose-400' },
                  ].map(s => {
                    const Icon = s.icon
                    return (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="stat-card"
                      >
                        <Icon size={18} className={s.color} />
                        <p className="text-2xl font-extrabold text-white">{s.value}</p>
                        <p className="text-slate-400 text-xs font-semibold">{s.label}</p>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Occupancy bar */}
                <div className="glass-card p-4 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                      <TrendingUp size={15} className="text-teal-400" /> Occupancy
                    </div>
                    <span className="text-teal-400 font-extrabold">{stats.occupancyPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.occupancyPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ background: 'linear-gradient(90deg,#14B8A6,#0D9488)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Boarding timeline ── */}
            {boardingLog.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Boarding Timeline</p>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {boardingLog.map((log, i) => (
                      <motion.div
                        key={log.bookingId}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="glass-card p-3 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)' }}>
                          <CheckCircle size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate">{log.travelerName}</p>
                          <p className="text-slate-400 text-xs">{log.bookingId}{log.seatNumber ? ` · Seat ${log.seatNumber}` : ''}</p>
                        </div>
                        <span className="text-slate-500 text-xs flex-shrink-0">{fmtTime(log.boardedAt)}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB Scan */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate('/scan')}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-brand"
        style={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)' }}
        aria-label="Scan QR"
      >
        <QrCode size={26} />
      </motion.button>
    </div>
  )
}
