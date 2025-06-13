'use client';

import { ResumeAnalysis } from '@/types/analysis';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Lightbulb, Target, CheckCircle, BarChart2, UserCheck, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResumeAnalysisReportProps {
  analysis: ResumeAnalysis;
}

const categoryKeyMap: Record<string, string> = {
  'Impact & Actionability': 'impactAndActionability',
  'Quantifiable Achievements': 'quantifiableAchievements',
  'Clarity & Readability': 'clarityAndReadability',
  'Completeness & Structure': 'completenessAndStructure',
  'Education Profile': 'educationProfile',
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Impact & Actionability':
      return <Target className="h-5 w-5 text-purple-400" />;
    case 'Quantifiable Achievements':
      return <BarChart2 className="h-5 w-5 text-blue-400" />;
    case 'Clarity & Readability':
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case 'Completeness & Structure':
      return <UserCheck className="h-5 w-5 text-yellow-400" />;
    case 'Education Profile':
      return <GraduationCap className="h-5 w-5 text-indigo-400" />;
    default:
      return <Lightbulb className="h-5 w-5 text-gray-400" />;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return '#4ade80'; 
  if (score >= 70) return '#facc15'; 
  return '#f87171'; 
};

export const ResumeAnalysisReport = ({ analysis }: ResumeAnalysisReportProps) => {
  const { t } = useTranslation();

  return (
    <div className="p-6 bg-neutral-900 text-white font-sans">
      <h2 className="text-2xl font-bold mb-2 text-center">{t('report.title')}</h2>
      <p className="text-sm text-neutral-400 mb-6 text-center">{t('report.subtitle')}</p>

      <div className="mb-8">
        <div className="w-32 h-32 mx-auto">
          <CircularProgressbar
            value={analysis.overallScore}
            text={`${analysis.overallScore}`}
            styles={buildStyles({
              textColor: '#ffffff',
              pathColor: getScoreColor(analysis.overallScore),
              trailColor: '#404040',
              textSize: '24px',
            })}
          />
        </div>
        <p className="text-center font-semibold mt-2">{t('report.overallScore')}</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 text-center">
        {analysis.analysis.map((item) => (
          <div key={item.category}>
            <div className="w-20 h-20 mx-auto">
              <CircularProgressbar
                value={item.score}
                text={`${item.score}`}
                styles={buildStyles({
                  textColor: '#d4d4d4',
                  pathColor: getScoreColor(item.score),
                  trailColor: '#404040',
                  textSize: '28px',
                })}
              />
            </div>
            <p className="text-xs font-medium mt-2 text-neutral-300">
              {t(`report.categories.${categoryKeyMap[item.category]}`, item.category)}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 border-b border-neutral-700 pb-2">{t('report.detailedAnalysis')}</h3>
        <div className="space-y-4">
          {analysis.analysis.map((item) => (
            <div key={item.category} className="bg-neutral-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                {getCategoryIcon(item.category)}
                <h4 className="font-semibold ml-2">
                  {t(`report.categories.${categoryKeyMap[item.category]}`, item.category)}
                </h4>
                <span className="ml-auto font-bold" style={{ color: getScoreColor(item.score) }}>{item.score}/100</span>
              </div>
              <p className="text-sm text-neutral-400 italic mb-3">&quot;{item.justification}&quot;</p>
              <div className="space-y-2">
                <h5 className="font-semibold text-sm flex items-center"><Lightbulb className="h-4 w-4 mr-2 text-yellow-300" /> {t('report.suggestions')}</h5>
                <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1 pl-2">
                  {item.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 