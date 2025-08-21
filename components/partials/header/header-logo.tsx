'use client'
import React from 'react'
import { Link } from '@/components/navigation'
import DashCodeLogo from "@/components/dascode-logo"
import { useConfig } from '@/hooks/use-config'
import { useMediaQuery } from '@/hooks/use-media-query'
import Image from "next/image";

const HeaderLogo = () => {
    const [config] = useConfig();

    const isDesktop = useMediaQuery('(min-width: 1280px)');

    return (
        config.layout === 'horizontal' ? (
            <Link href="/dashboard" className="flex gap-2 items-center    ">
                {/* <DashCodeLogo className="  text-default-900 h-8 w-8 [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background" /> */}
                <Image
                    src="/images/logo/logo.png"
                    alt="dashcode"
                    width={90}
                    height={48}
                    className="w-[60px] h-auto object-contain  [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background"
                // className="w-full h-auto object-contain  [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background"
                />
                <h1 className="text-xl font-semibold text-default-900 lg:block hidden ">
                    SAM Airline Maintainance
                </h1>
            </Link>
        ) :
            !isDesktop && (
                <Link href="/dashboard" className="flex gap-2 items-center    ">
                    {/* <DashCodeLogo className="  text-default-900 h-8 w-8 [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background" /> */}
                    <Image
                        src="/images/logo/logo.png"
                        alt="dashcode"
                        width={90}
                        height={48}
                        className="w-[60px] h-auto object-contain  [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background"
                    />
                    <h1 className="text-xl font-semibold text-default-900 lg:block hidden ">
                        SAM Airline Maintainance
                    </h1>
                </Link>
            )
    )
}

export default HeaderLogo