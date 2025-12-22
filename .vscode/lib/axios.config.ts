import axios from 'axios'

// สร้าง axios instance
const instance = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_ENVIRONTMENT !== 'production' ? process.env.NEXT_PUBLIC_DEVELOPMENT_API : process.env.NEXT_PUBLIC_PRODUCTION_API)}`,// + process.env.NEXT_PUBLIC_API_VERSION,
  timeout: (10 * 1000),
  headers: {
    "Content-Type": "Application/json"
  }
})

// กำหนด Global Request เมื่อมีการ Request โดยใช้ axios
instance.interceptors.request.use(req => {
  if (req.url !== '/auth/re-signin') {
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
  if (error.response.status === 401 && originalRequest.url !== '/auth/re-signin') {
    try {
      const refresh_token = localStorage.getItem('refresh_token') ?? ''
      const { data: { data } } = await instance.post('/auth/re-signin', null, {
        headers: {
          Authorization: `Bearer ${refresh_token}`
        }
      })

      // เมื่อ Try ผ่าน ก็ให้กลับมาเซ็ต access_token และ refresh_token ตามปกติเลย
      // อันนี้ของผมใช้ Loop for of เพราะ api ส่ง data กลับมาเป็น [{ access_token: string, refresh_token: string }]
      for (const { access_token: new_access_token, refresh_token: new_refresh_token } of data) {
        localStorage.setItem('access_token', new_access_token)
        localStorage.setItem('refresh_token', new_refresh_token)
      }

      // คืนค่ากลับ
      return instance(originalRequest);
    }

    // กรณีที่ re-signin หรือ api refrest token ของเรามันไม่สามารถ refresh token ให้ใหม่ได้เนื่องจาก refresh token ก็หมดอายุไปแล้ว
    // เราก็มา catch แล้วเซ็ตให้ลบ token เดิมออกให้หมด แล้วไล่ user ไปล็อกอินใหม่ซะ
    catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      location.href = '/signin'
    }
  }

  // กรณีที่ Endpoint อื่นๆ เกิด HTTP Error 400 403 404 500 หรืออื่นๆ ก็จะ throw ตามปกติ
  return Promise.reject(error)
}
)

export default instance