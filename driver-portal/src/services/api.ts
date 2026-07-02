import axios from 'axios'

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return 'https://traveloopv2.duckdns.org/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('driver_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('driver_token')
      localStorage.removeItem('driver_info')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const sendOtp    = (email: string)             => api.post('/driver/auth/send-otp', { email })
export const verifyOtp  = (email: string, otp: string)=> api.post('/driver/auth/verify-otp', { email, otp })
export const googleAuth = (payload: object)           => api.post('/driver/auth/google', payload)

// Dashboard & data
export const getMe        = ()              => api.get('/driver/me')
export const getDashboard = ()              => api.get('/driver/dashboard')
export const getManifest  = (tripId: string)=> api.get(`/driver/trip/${tripId}/manifest`)
export const scanQr       = (qrToken: string)=> api.post('/driver/scan', { qrToken })
export const boardPassenger = (bookingId: string, seatNumber: string, boardingPassId: string) =>
  api.post(`/driver/board/${bookingId}`, { seatNumber, boardingPassId })
export const markNoShow   = (bookingId: string) => api.post(`/driver/no-show/${bookingId}`)
export const getSeats     = (tripId: string)    => api.get(`/driver/seats/${tripId}`)
export const openBoarding = (tripId: string)    => api.post(`/driver/trips/${tripId}/open-boarding`)
export const closeBoarding = (tripId: string)   => api.post(`/driver/trips/${tripId}/close-boarding`)

export default api
