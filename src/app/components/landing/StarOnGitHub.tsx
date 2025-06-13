'use client'

import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";

export default function StarOnGitHub() {
    const [stars, setStars] = useState<number | null>(null);

    useEffect(() => {
        fetch('/api/github-stars')
            .then(res => res.json())
            .then(data => {
                if (data && typeof data.stars === 'number') {
                    setStars(data.stars);
                }
            })
            .catch(err => {
                console.error('Failed to fetch stars:', err);
            });
    }, []);
    return (
        <a href="https://github.com/LinMoQC/Magic-Resume" target="_blank" rel="noopener noreferrer" className="bg-[#211E2D] border hidden md:flex border-neutral-700 rounded-lg px-4 py-2 items-center gap-3 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
            <FaStar className="text-yellow-400" />
            <span>Star on GitHub</span>
            <span className="text-neutral-600">|</span>
            <span className="font-semibold text-white">
                {stars !== null ? new Intl.NumberFormat().format(stars) : '...'}
            </span>
        </a>
    );
}