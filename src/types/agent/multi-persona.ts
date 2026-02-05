// Multi-Persona Resume Analysis Types

export interface PersonaAnalysis {
  persona: 'peer_developer' | 'tech_lead' | 'hrbp';
  score: number;
  categories_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface MultiPersonaResumeAnalysis {
  overall_score: number;
  category_averages: Record<string, number>;
  peer_analysis: PersonaAnalysis;
  leader_analysis: PersonaAnalysis;
  hrbp_analysis: PersonaAnalysis;
}

