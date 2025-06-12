"use client";

import React from 'react';
import { InfoType, Section } from '@/store/useResumeStore';
import { FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface Props {
  info: InfoType;
  sections: Section;
  sectionOrder: string[];
  customStyle?: React.CSSProperties;
}

export default function ResumePreview({ info, sections, sectionOrder,customStyle }: Props) {
  const { t } = useTranslation();
  return (
    <div
      id="resume-to-export"
      className="mx-auto max-w-[794px] w-[794px] bg-white text-black rounded-md shadow-2xl relative font-serif min-h-[1100px]"
      style={{ fontFamily: '"IBM Plex Serif", serif',...customStyle }}
    >
      <div className="p-3 space-y-4">
        {/* 顶部信息 */}
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
            <div className="text-sm font-bold">{info.fullName || t('resumePreview.yourName')}</div>
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

        {sectionOrder.map(key => {
          const items = sections[key] || [];
          if (!Array.isArray(items) || !items.length) return null;
          if (["skills", "awards", "languages", "certificates"].includes(key)) {
            return (
              <section id={key} className="grid text-[12px]" key={key}>
                <h4 className="font-bold text-primary text-[1.2em] text-blue-500">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                <div className="grid gap-x-6 gap-y-1" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                  {items.map((item, idx) => (
                    <div className="space-y-2" key={idx}>
                      <div>
                        <div className="font-bold">
                          {String(item.name || item.title || item.platform || item.certificate || item.language || item.skill || item.award || Object.values(item)[0])}
                        </div>
                        {item.level && <div>{String(item.level)}</div>}
                        {item.date && <div>{String(item.date)}</div>}
                        {item?.summary && <div className="wysiwyg" dangerouslySetInnerHTML={{ __html: String(item.summary) }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          // 其余分区用左右结构
          return (
            <section id={key} className="grid text-[12px]" key={key}>
              <h4 className="font-bold text-primary text-[1.2em] text-blue-500">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
              <div className="grid gap-x-6 gap-y-3" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                {items.map((item, idx) => (
                  <div className="space-y-2" key={idx}>
                    <div>
                      <div className="flex items-start">
                        <div className="flex-1 text-left">
                          <div className="font-bold">{item.school || item.company || item.project || item.platform || item.title || item.name || Object.values(item)[0]}</div>
                          {item.location && <div>{item.location}</div>}
                          {item.major && <div>{item.major}</div>}
                        </div>
                        <div className="shrink-0 text-right">
                          {item.date && <div className="font-bold">{item.date}</div>}
                          {item.position && <div>{item.position}</div>}
                          {item.degree && <div>{item.degree}</div>}
                        </div>
                      </div>
                      {item.description && <div className="wysiwyg" dangerouslySetInnerHTML={{ __html: String(item.description) }} />}
                      {item.summary && <div className="wysiwyg" dangerouslySetInnerHTML={{ __html: String(item.summary) }} />}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
} 
