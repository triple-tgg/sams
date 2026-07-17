# Redux-Only Auth System Documentation

## ระบบ Authentication แบบ Redux เท่านั้น

### 1. **AuthProvider** (`providers/auth.provider.tsx`)
Redux Provider พร้อม Auth Guard สำหรับจัดการสถานะ authentication

**Features:**
- ✅ ใช้ Redux เป็นหลักในการจัดการ auth state
- ✅ ตรวจสอบ authentication จาก localStorage และ sync กับ Redux
- ✅ Auto redirect based on auth status  
- ✅ Protected และ public routes
- ✅ Loading states
- ✅ ไม่ใช้ Context API

### 2. **useReduxAuth Hook** (`lib/api/hooks/useReduxAuth.ts`)
```tsx
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'

const MyComponent = () => {
  const { 
    isAuthenticated, 
    user, 
    getUserFullName, 
    isAdmin,
    hasRole 
  } = useReduxAuth()
  
  if (!isAuthenticated) return <div>Please login</div>
  
  return (
    <div>
      <h1>Welcome {getUserFullName()}</h1>
      {isAdmin() && <div>Admin Panel</div>}
    </div>
  )
}
```

### 3. **Login Integration** - Redux Only
```tsx
import { useLogin } from '@/lib/api/hooks/useLogin'

const { mutate: loginUser, isPending } = useLogin({
  onSuccess: (data) => {
    // Auto จัดการ Redux update และ navigation
    console.log('Login successful')
  }
})

// ใช้งาน
loginUser({ userName: 'navee', password: 'sams-password' })
```

### 4. **Logout System** - Redux Only
```tsx
import { useLogout } from '@/lib/api/hooks/useLogout'
import LogoutButton from '@/components/ui/logout-button'

// Hook
const { handleLogout, isAuthenticated } = useLogout()

// Component
<LogoutButton /> // Auto แสดงชื่อ user ด้วย
```

### 5. **Protected Routes** (`components/auth/withAuth.tsx`)
```tsx
import { withAuth } from '@/components/auth/withAuth'

// Protect entire component
const ProtectedPage = withAuth(MyPage)

// Admin only
const AdminPage = withAuth(MyPage, { 
  allowedRoles: ['admin'] 
})
```

### 6. **Permissions Hook**
```tsx
import { usePermissions } from '@/components/auth/withAuth'

const { hasRole, isAdmin, user, isAuthenticated } = usePermissions()

if (isAdmin()) {
  // Show admin content
}
```

## Redux State Structure

```typescript
interface AuthProfile {
  id?: number | null
  fullName?: string | null
  email?: string | null
  username?: string | null  // ใช้ username (ไม่ใช่ userName)
  role?: string
  token?: string
  reToken?: string
}

interface AuthState {
  users: AuthProfile | undefined
  isAuth: boolean
}
```

## API Data Mapping

**Login API Response:**
```json
{
  "responseData": {
    "id": 1,
    "userName": "navee",  // จะ map เป็น username ใน Redux
    "email": "navee@gmail.com",
    "fullName": "navee taithaisong", 
    "role": "admin"
  }
}
```

## การใช้งาน

### Setup (ใน root layout)
```tsx
import AuthProvider from '@/providers/auth.provider'

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
```

### Redux State Access
```tsx
// Option 1: ใช้ useReduxAuth (แนะนำ)
const { isAuthenticated, user, isAdmin } = useReduxAuth()

// Option 2: ใช้ useSelector โดยตรง
const { isAuth, users } = useSelector((state: RootState) => state.auth)
```

### Navigation with Auth Check
```tsx
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import LogoutButton from '@/components/ui/logout-button'

const Navbar = () => {
  const { isAuthenticated, getUserFullName } = useReduxAuth()
  
  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Hello {getUserFullName()}</span>
          <LogoutButton />
        </>
      ) : (
        <Link href="/auth/login">Login</Link>
      )}
    </nav>
  )
}
```

## Auto Features

### Login Flow
1. User login → API call → Store user data → Update Redux → Navigate to dashboard

### Auth Guard
- ✅ ไม่ได้ login + เข้า protected route → redirect ไป `/auth/login`
- ✅ Login แล้ว + เข้า `/auth/login` → redirect ไป `/dashboard`  
- ✅ ไม่มีสิทธิ์ → แสดง "Access Denied"

### Data Persistence
- ✅ localStorage sync กับ Redux state
- ✅ Auto restore auth จาก localStorage เมื่อ refresh page
- ✅ Auto clear data เมื่อ logout หรือ error

## Key Differences from Context Version

| Feature | Context Version | Redux Version |
|---------|----------------|---------------|
| State Management | React Context | Redux Store |
| Provider | AuthContext | Redux Provider |
| Hook | useAuth() | useReduxAuth() |
| Auth Guard | Context-based | Redux-based |
| Data Sync | Manual sync | Auto sync |
| Performance | Re-render issues | Optimized |

## Migration Guide

### Before (Context):
```tsx
const { user, isAuthenticated, logout } = useAuth()
```

### After (Redux):
```tsx
const { user, isAuthenticated } = useReduxAuth()
const { handleLogout } = useLogout()
```

ระบบ Redux Auth พร้อมใช้งานแล้ว! 🚀
