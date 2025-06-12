import React from 'react';
import { InfoType } from '@/store/useResumeStore';
import { FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';
import Image from 'next/image';

interface Props {
  data: InfoType;
}

export function Header({ data: info }: Props) {
  return (
    <div className="flex items-center space-x-4">
      {info.avatar && (
        <Image
          src={info.avatar}
          alt="avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border border-neutral-300"
          style={{ background: '#f3f3f3' }}
          unoptimized
        />
      )}
      <div className="space-y-0.5">
        <div className="text-sm font-bold">{info.fullName || 'Your Name'}</div>
        <div className="text-xs">{info.headline}</div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
          {info.address && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <FaMapMarkerAlt className="text-primary" />
              <div>{info.address}</div>
            </div>
          )}
          {info.phoneNumber && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <FaPhone className="text-primary" />
              <a href={`tel:${info.phoneNumber}`}>{info.phoneNumber}</a>
            </div>
          )}
          {info.email && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <FaEnvelope className="text-primary" />
              <a href={`mailto:${info.email}`}>{info.email}</a>
            </div>
          )}
          {info.website && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <FaGlobe className="text-primary" />
              <a href={info.website} target="_blank" rel="noreferrer noopener nofollow" className="inline-block">{info.website}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 