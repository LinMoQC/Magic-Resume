'use client';

import { Card, CardContent } from "@/components/ui/card";

export default function TemplatePanel() {
  return (
    <div className="h-full bg-neutral-950 p-6 flex flex-col w-full">
      <h2 className="text-xl font-bold mb-6 text-white">Template</h2>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-neutral-800 border-neutral-700 aspect-square flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-0">
              <p className="text-neutral-400">模板 {i + 1}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex-grow"></div>
      <div className="flex justify-center items-center gap-4 text-white p-2 text-lg">
          <button className="p-2 rounded-full hover:bg-neutral-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="16" /><line x1="8" x2="16" y1="12" y2="12" /></svg>
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-800">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><line x1="8" x2="16" y1="12" y2="12" /></svg>
          </button>
           <button className="p-2 rounded-full hover:bg-neutral-800">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="3" /></svg>
          </button>
      </div>
    </div>
  );
} 