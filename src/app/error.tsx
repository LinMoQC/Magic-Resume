'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 md:p-12 max-w-lg mx-auto text-center relative z-10 shadow-2xl"
      >
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Something went wrong!
        </h2>
        
        <p className="text-neutral-400 mb-8 leading-relaxed">
          We apologize for the inconvenience. An unexpected error has occurred. You can try refreshing the page or navigating back home.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            onClick={() => reset()}
            size="lg" 
            className="w-full sm:w-auto gap-2 bg-white text-black hover:bg-neutral-200"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </Button>
          
          <Link href="/" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full gap-2 bg-transparent border-neutral-800 text-neutral-300 hover:bg-neutral-900"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-black/50 rounded-lg text-left overflow-auto max-h-48 border border-neutral-800">
            <p className="font-mono text-xs text-red-400">
              {error.message || "Unknown error occurred"}
            </p>
            {error.stack && (
              <pre className="mt-2 text-[10px] text-neutral-500 whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
