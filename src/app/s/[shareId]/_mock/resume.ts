import { Resume } from '@/types/frontend/resume';
import { initialResume } from '@/store/useResumeStore';

export const MOCK_RESUME: Resume = {
  ...initialResume,
  id: 'mock-resume-id',
  name: 'Alex Chen Resume',
  info: {
    fullName: 'Alex Chen',
    headline: 'Senior Full Stack Developer',
    email: 'alex.chen@example.com',
    phoneNumber: '+1 (555) 123-4567',
    address: 'San Francisco, CA',
    website: 'https://alexchen.dev',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
  sections: {
    ...initialResume.sections,
    summary: [{
      id: '1', visible: true, content: 'Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications using React, Node.js, and TypeScript. Passionate about clean code, performance optimization, and user experience.'
    }],
    experience: [{
      id: '1', visible: true, 
      company: 'Tech Innovators Inc.',
      position: 'Senior Frontend Engineer',
      startDate: '2021-03',
      endDate: 'Present',
      location: 'San Francisco, CA',
      summary: '• Led the migration of legacy monolithic application to micro-frontend architecture.\n• Improved page load time by 40% through code splitting and lazy loading.\n• Mentored junior developers and established code review guidelines.'
    }, {
      id: '2', visible: true,
      company: 'StartUp Solutions',
      position: 'Full Stack Developer',
      startDate: '2018-06',
      endDate: '2021-02',
      location: 'Austin, TX',
      summary: '• Developed and deployed a SaaS platform serving 10k+ active users.\n• implemented real-time collaboration features using WebSockets and Redis.\n• Designed RESTful APIs and integrated third-party payment gateways.'
    }],
    skills: [{
      id: '1', visible: true,
      name: 'JavaScript / TypeScript', level: 'Expert'
    }, {
      id: '2', visible: true,
      name: 'React / Next.js', level: 'Expert'
    }, {
      id: '3', visible: true,
      name: 'Node.js / NestJS', level: 'Advanced'
    }, {
      id: '4', visible: true,
      name: 'PostgreSQL / Prisma', level: 'Advanced'
    }],
    education: [{
      id: '1', visible: true,
      institution: 'University of Technology',
      area: 'Computer Science',
      studyType: 'Bachelor of Science',
      startDate: '2014-09',
      endDate: '2018-06',
      score: '3.8 GPA'
    }]
  },
  sectionOrder: [
    { key: 'basics', label: 'Basics' },
    { key: 'summary', label: 'Summary' },
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Skills' },
    { key: 'projects', label: 'Projects' },
  ],
  isPublic: true,
  shareId: 'mock_preview',
  updatedAt: Date.now(),
  template: 'classic',
  themeColor: '#3b82f6',
  typography: 'inter',
  customTemplate: {
    layout: {
        containerHeight: 'fit-content' // 这里确保内容能够完整撑开
    }
  }
};
