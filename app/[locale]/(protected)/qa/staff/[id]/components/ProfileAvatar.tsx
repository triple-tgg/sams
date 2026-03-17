'use client'

import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import Image from 'next/image'

interface ProfileAvatarProps {
    initials: string
    avatarBg: string
    profileImage?: string
}

export function ProfileAvatar({ initials, avatarBg, profileImage }: ProfileAvatarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(profileImage ?? null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) return

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) return

        // Create preview URL
        const url = URL.createObjectURL(file)
        setImageUrl(url)

        // TODO: Upload to server
        // const formData = new FormData()
        // formData.append('avatar', file)
        // await fetch('/api/staff/avatar', { method: 'POST', body: formData })
    }

    return (
        <div className="relative group shrink-0">
            {/* Avatar Circle */}
            <div
                className="w-50 h-50 rounded-md overflow-hidden border-[3px] border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                style={{ background: !imageUrl ? avatarBg : undefined }}
            >
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-white">
                        {initials}
                    </div>
                )}
            </div>

            {/* Hover Overlay with Camera Icon */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 w-50 h-50 rounded-xl flex items-center justify-center
                    bg-black/0 group-hover:bg-black/40
                    cursor-pointer transition-all duration-200 border-none p-0"
            >
                <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-md" />
            </button>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}
