"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiFeather, FiEye, FiMove, FiLock, FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';

const features = [
  {
    icon: <FiFeather className="h-8 w-8 text-sky-400" />,
    title: 'AI Assistant',
    description: "Overcome writer's block. Generate professional summaries and descriptions with our integrated OpenAI/Ollama support.",
  },
  {
    icon: <FiEye className="h-8 w-8 text-sky-400" />,
    title: 'Live Preview',
    description: 'See your changes in real-time as you type. No more guessing how your final resume will look.',
  },
  {
    icon: <FiMove className="h-8 w-8 text-sky-400" />,
    title: 'Drag & Drop Interface',
    description: 'Effortlessly reorder sections to highlight your strengths with an intuitive drag-and-drop interface.',
  },
  {
    icon: <FiLock className="h-8 w-8 text-sky-400" />,
    title: 'Privacy First',
    description: 'Your data is yours. All your resume information is stored securely in your browser—never leaving your machine.',
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-lg border-b border-neutral-800 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Image src="/magic-resume-logo.png" alt="magic-resume-logo" width={150} height={0} style={{ height: 'auto' }} />
          <Link href="/dashboard" legacyBehavior>
            <a className="bg-white text-black px-5 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors">
              Go to App
            </a>
          </Link>
        </div>
      </header>

      <main className="pt-24">
        <section className="text-center container mx-auto px-6 py-20 md:py-32">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight mb-4">
              The Modern, AI-Powered <br className="hidden md:inline" /> Resume Builder
            </h2>
            <p className="text-lg md:text-xl text-neutral-400 max-w-3xl mx-auto mb-8">
              Create a professional resume in minutes. Leverage AI to craft compelling content, choose from sleek templates, and land your dream job.
            </p>
            <Link href="/dashboard" legacyBehavior>
              <a className="bg-sky-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-sky-600 transition-colors inline-flex items-center gap-2">
                Get Started <FiArrowRight />
              </a>
            </Link>
          </motion.div>
        </section>

        <section className="py-20 bg-neutral-900/50">
          <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.2 } }
              }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={fadeIn} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                  <p className="text-neutral-400">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="container mx-auto px-6 py-8 text-center text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Magic Resume. Built for modern professionals.</p>
        </div>
      </footer>
    </div>
  );
}