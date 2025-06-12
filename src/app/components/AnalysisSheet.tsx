'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { ResumeAnalysis } from "@/lib/types/analysis";
import { ResumeAnalysisReport } from "../ResumeAnalysisReport";
import { BarChart3 } from "lucide-react";

interface AnalysisSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResult: ResumeAnalysis | null;
  isAnalyzing: boolean;
}

export const AnalysisSheet = ({ open, onOpenChange, analysisResult, isAnalyzing }: AnalysisSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full md:w-3/4 lg:w-1/2 xl:w-2/5 p-0 bg-neutral-900 border-l border-neutral-800 overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle className="text-white flex items-center">
            <BarChart3 className="mr-2" />
            Resume Analysis
          </SheetTitle>
          <SheetDescription className="text-neutral-400">
            Here&apos;s a detailed breakdown of your resume&apos;s strengths and areas for improvement.
          </SheetDescription>
        </SheetHeader>
        <div className="h-[calc(100vh-120px)] overflow-y-auto">
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full text-white">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
              <p className="mt-4 text-lg">Analyzing your resume...</p>
              <p className="text-sm text-neutral-400">This might take a moment.</p>
            </div>
          )}
          {analysisResult && !isAnalyzing && (
            <ResumeAnalysisReport analysis={analysisResult} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}; 