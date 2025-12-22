'use client'

import { motion } from 'framer-motion'
import { usePathname } from '@/components/navigation'

import dayjs from 'dayjs'
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
dayjs.extend(buddhistEra);
// dayjs.locale('th');


export default function Template({ children }: { children: React.ReactNode }) {

    const pathname = usePathname()
    return (
        <motion.div
            key={pathname}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}

        >
            {children}
        </motion.div>
    )
}