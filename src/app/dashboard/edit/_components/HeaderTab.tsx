import { House } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeaderTabProps {
    title?: string;
    updatedAt?: number;
}

export default function HeaderTab({ title, updatedAt }: HeaderTabProps) {
    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return (
        <motion.div
            initial={{ y: -50, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, mass: 1 }}
            className='w-[600px] h-10 px-4 bg-neutral-900 absolute top-3 left-[50%] z-10 rounded-xl flex items-center justify-between text-sm text-neutral-400 border border-neutral-800 shadow-lg font-mono'
        >
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="hover:text-neutral-200 transition-colors">
                    <House size={16} />
                </Link>
                <span className='text-neutral-700'>/</span>
                <span className='text-neutral-200 font-medium truncate max-w-[300px]'>{title || '未命名简历'}</span>
            </div>
            <span className='text-xs text-neutral-600'>最后更新于 {formatTime(updatedAt)}</span>
        </motion.div>
    )
}