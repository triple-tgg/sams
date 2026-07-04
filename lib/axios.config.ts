import axios from 'axios'
import store from '@/store'
import { handleLogout } from '@/components/partials/auth/store'
import { clearPermissions } from '@/components/partials/auth/permissionSlice'

// สร้าง axios instance
const instance = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_ENVIRONTMENT !== 'production' ? process.env.NEXT_PUBLIC_DEVELOPMENT_API : process.env.NEXT_PUBLIC_PRODUCTION_API)}`,// + process.env.NEXT_PUBLIC_API_VERSION,
  timeout: (30 * 1000),
  headers: {
    "Content-Type": "Application/json"
  }
})

// Flag to prevent multiple refresh requests at the same time
let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

// กำหนด Global Request เมื่อมีการ Request โดยใช้ axios
instance.interceptors.request.use(req => {
  if (req.url !== '/user/refresh-token' && req.url !== '/user/login') {
    const access_token = (localStorage.getItem('access_token') ?? '')
    const token = access_token
    req.headers.Authorization = `Bearer ${token}`
  }
  return req
})

// ตั้งค่า Global Response หลังจาก Req ไปแล้ว ถ้า error เราจะมา handle ที่นี่
instance.interceptors.response.use(res => res, async error => {
  const originalRequest = error.config

  // Detect เอาเฉพาะ HTTP Status 401 เท่านั้น และตอนที่ได้รับ 401 Request นั้นต้องไม่ใช่ Endpoint ที่ใช้ขอ Token ใหม่
  if (error.response && error.response.status === 401 && originalRequest.url !== '/user/refresh-token' && !originalRequest._retry) {
    // ถ้ากำลัง refresh อยู่ ให้ request อื่นๆ รอ queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return instance(originalRequest)
      }).catch(err => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refresh_token = localStorage.getItem('refresh_token')
      if (!refresh_token) {
        throw new Error('No refresh token available')
      }
      
      const { data } = await axios.post(`${instance.defaults.baseURL}/user/refresh-token`, {
        refreshToken: refresh_token
      })

      if (data.message === 'success' && data.responseData) {
        const newAccessToken = data.responseData.accessToken
        const newRefreshToken = data.responseData.refreshToken

        // เก็บ token ใหม่
        localStorage.setItem('access_token', newAccessToken)
        localStorage.setItem('refresh_token', newRefreshToken)
        localStorage.setItem('user', JSON.stringify(data.responseData))

        // อัปเดต permissions ใน Redux store (ถ้ามี)
        if (data.responseData.menuPermissions && typeof window !== 'undefined') {
          const event = new CustomEvent('token-refreshed', {
            detail: {
              permissions: data.responseData.menuPermissions,
              user: data.responseData
            }
          })
          window.dispatchEvent(event)
        }

        // ปล่อย queue ที่รออยู่ให้ไปต่อ
        processQueue(null, newAccessToken)

        // retry request เดิมด้วย token ใหม่
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return instance(originalRequest)
      } else {
        throw new Error('Refresh token failed')
      }
    }

    // กรณีที่ refresh token หมดอายุ หรือล้มเหลว → ลบ token → set isAuth = false → ไล่ไป login ใหม่
    catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')

      try {
        // Reset Redux auth state (wrapped in try-catch to prevent circular dependency errors from blocking redirect)
        if (store && store.dispatch) {
          store.dispatch(handleLogout())
          store.dispatch(clearPermissions())
        }
      } catch (e) {
        console.warn('Could not dispatch logout to Redux store:', e)
      }

      const locale = window.location.pathname.match(/^\/(en|ar)/)?.[1] ?? 'en'
      window.location.href = `/${locale}/auth/login`
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }

  // กรณีที่ Endpoint อื่นๆ เกิด HTTP Error 400 403 404 500 หรืออื่นๆ ก็จะ throw ตามปกติ
  return Promise.reject(error)
}
)

export default instance