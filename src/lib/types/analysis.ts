import { z } from 'zod';

export const analysisCategorySchema = z.object({
  category: z.string().describe('The category of the analysis (e.g., "Impact & Actionability", "Quantifiable Achievements").'),
  score: z.number().min(0).max(100).describe('The score for this category, from 0 to 100.'),
  justification: z.string().describe('A brief justification for why this score was given.'),
  suggestions: z.array(z.string()).describe('Specific, actionable suggestions for improvement in this category.'),
});

export const resumeAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('The overall weighted score for the entire resume, from 0 to 100.'),
  analysis: z.array(analysisCategorySchema).describe('An array of analysis results for different categories.'),
});

export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>; 