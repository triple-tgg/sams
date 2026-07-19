'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface ProfileAvatarProps {
    initials: string
    avatarBg: string
    profileImage?: string
    onUpload: (file: File) => Promise<string>
}

export function ProfileAvatar({ initials, avatarBg, profileImage, onUpload }: ProfileAvatarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(profileImage ?? null)
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        setImageUrl(profileImage ?? null)
    }, [profileImage])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please select a JPG, PNG, or WEBP image')
            e.target.value = ''
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Profile image must not exceed 5 MB')
            e.target.value = ''
            return
        }

        const previousImage = imageUrl
        const previewUrl = URL.createObjectURL(file)
        setImageUrl(previewUrl)
        setIsUploading(true)
        e.target.value = ''

        try {
            const savedPath = await onUpload(file)
            setImageUrl(savedPath)
        } catch {
            setImageUrl(previousImage)
        } finally {
            URL.revokeObjectURL(previewUrl)
            setIsUploading(false)
        }
    }

    return (
        <div className="relative group shrink-0">
            {/* Avatar Circle */}
            <div
                className={`w-50 h-50 rounded-md overflow-hidden border-[3px] border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${!imageUrl ? 'bg-muted flex items-center justify-center' : ''}`}
            >
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt="Profile"
                        width={400}
                        height={400}
                        sizes="200px"
                        quality={95}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User className="h-16 w-16 text-muted-foreground" />
                )}
            </div>

            {/* Hover Overlay with Camera Icon */}
            <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 w-50 h-50 rounded-xl flex items-center justify-center
                    bg-black/0 group-hover:bg-black/40
                    cursor-pointer transition-all duration-200 border-none p-0"
            >
                {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white drop-shadow-md" />
                ) : (
                    <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-md" />
                )}
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
