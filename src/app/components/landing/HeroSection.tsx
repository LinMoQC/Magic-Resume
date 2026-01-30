"use client";

import Link from 'next/link';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { FiArrowRight, FiZap, FiGithub } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useTrace } from '@/app/hooks/useTrace';
import ShinyText from '@/components/ShinyText';
import TextType from '@/components/TextType';
import DotGrid from '@/components/DotGrid';
import { MacbookScroll } from '@/components/ui/macbook-scroll';
import { useEffect, useState } from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transition: { type: "spring", stiffness: 40, damping: 10, mass: 1 } as any
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export function HeroSection() {
  const { t } = useTranslation();
  const controls = useAnimation();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const [stars, setStars] = useState<number | null>(null);
  const { traceGetStarted, traceGithubStar } = useTrace();

  // Fetch GitHub stars
  useEffect(() => {
    fetch('/api/github-stars')
      .then(res => res.json())
      .then(data => {
        if (data.stars) setStars(data.stars);
      })
      .catch(console.error);
  }, []);


  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  return (
    <motion.section
      className="relative container mx-auto px-6 py-24 min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ y }}
    >
      {/* DotGrid Background */}
      <div className="absolute inset-0 w-full h-full">
        <DotGrid
          dotSize={5}
          gap={15}
          baseColor="#1a1a1a"
          activeColor="#7e22ce"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* 3D Perspective Container */}
      <div className="flex flex-col items-center max-w-5xl mx-auto relative z-10 w-full space-y-16">
        
        {/* Text Content - Left Aligned */}
        <motion.div
          initial="hidden"
          animate={controls}
          variants={staggerContainer}
          className="flex flex-col items-start text-left space-y-8 max-w-5xl w-full"
        >
          {/* Tag / Badge */}
          <motion.div variants={fadeInUp} className="flex justify-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all hover:bg-white/10 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="font-medium tracking-wide">{t("landing.hero.tag")}</span>
            </div>
          </motion.div>

          {/* Main Title - Linear Style with ShinyText */}
          <motion.div variants={fadeInUp} className="relative w-full max-w-5xl">
            <h1 className="text-3xl md:text-[48px] font-bold tracking-[-0.02em] leading-[1.15] text-left pb-2">
              <ShinyText
                text={"✨ " + t("landing.hero.title")}
                speed={2}
                delay={0}
                color="#b5b5b5"
                shineColor="#ffffff"
                spread={90}
                direction="left"
                yoyo={false}
                pauseOnHover={false}
                disabled={false}
              />
            </h1>
          </motion.div>

          {/* Subtitle - Vision Focus */}
          <motion.p
            variants={fadeInUp}
            className="text-base md:text-[17px] text-neutral-400 max-w-3xl leading-relaxed font-light text-left min-h-[5rem] md:min-h-[1.5rem]"
          >
             <TextType
                as="span"
                text={t("landing.hero.texts", { returnObjects: true }) as string[]}
                typingSpeed={80}
                deletingSpeed={50}
                pauseDuration={2000}
                loop={true}
                showCursor={true}
                cursorCharacter="|"
                className="inline-block"
              />
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-start w-full"
          >
            {/* Primary Glowing Button */}
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto"
              onClick={() => traceGetStarted()}
            >
              <div className="group relative rounded-full p-[1px] bg-gradient-to-b from-white/20 to-white/0 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300">
                  <div className="relative rounded-full bg-gradient-to-b from-[#7e22ce] to-[#581c87] px-8 py-4 flex items-center justify-center sm:justify-start gap-2 overflow-hidden transition-all duration-300 group-hover:brightness-110">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="font-semibold text-white tracking-wide">{t("landing.hero.getStarted")}</span>
                      <FiArrowRight className="text-white group-hover:translate-x-1 transition-transform" />
                  </div>
              </div>
            </Link>

            {/* Glass Button (GitHub) - Hidden on mobile, moved to Footer */}
             <a 
               href="https://github.com/LinMoQC/Magic-Resume" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="hidden md:flex"
               onClick={() => traceGithubStar('hero_glass_button')}
             >
              <div className="px-8 py-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2 cursor-pointer">
                <FiGithub className="text-neutral-300" />
                <span className="text-neutral-200 font-medium">{t("landing.buttons.starOnGithub")}</span>
                {stars !== null && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs text-neutral-400 font-mono">
                        {stars}
                    </span>
                )}
              </div>
            </a>
          </motion.div>

          {/* Feature Tags */}
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-x-8 gap-y-2 justify-start text-sm text-neutral-500 font-medium pt-2">
             <span className="flex items-center gap-2"><FiZap className="text-purple-400"/> {t("landing.hero.featureTags.ai")}</span>
             <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400"/> {t("landing.hero.featureTags.local")}</span>
             <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"/> {t("landing.hero.featureTags.openSource")}</span>
          </motion.div>
        </motion.div>

        {/* Macbook Scroll Animation / Mobile Static Image */}
        <div className="w-full h-full -mt-20 overflow-hidden origin-top">
          {/* PC View: MacbookScroll */}
          <div className="hidden md:block">
            <MacbookScroll
              src="/magic-resume-preview.png"
              showGradient={false}
              title={
                <span className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500">
                  Magic Resume <br /> 
                  <span className="text-2xl md:text-3xl text-purple-400">{t("landing.hero.macbookSubtitle")}</span>
                </span>
              }
              badge={
                <Link 
                  href="https://github.com/LinMoQC/Magic-Resume"
                  onClick={() => traceGithubStar('hero_macbook_badge')}
                >
                  <div className="h-10 w-10 transform -rotate-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                     <FiGithub className="text-white w-6 h-6" />
                  </div>
                </Link>
              }
            />
          </div>

          {/* Mobile View: Regular Image */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="block md:hidden mt-32 px-4"
          >
            <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-purple-500/10">
              <Image 
                src="/magic-resume-preview.png" 
                alt="Magic Resume Preview" 
                width={800} 
                height={600} 
                className="w-full h-auto"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
