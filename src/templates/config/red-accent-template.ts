import { MagicTemplateDSL } from '../types/magic-dsl';

export const redAccentTemplate: MagicTemplateDSL = {
  id: "red-accent",
  name: "Red Accent",
  version: "1.0.0",
  description: "Professional single-column design with red accent lines and clean typography",
  thumbnailUrl: "/thumbnails/red-accent.png",
  tags: ["professional", "single-column", "red", "modern", "clean"],
  status: "PUBLISHED",
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#dc2626",
      secondary: "#374151", 
      text: "#1f2937",
      textSecondary: "#6b7280",
      background: "#ffffff",
      border: "#e5e7eb"
    },
    typography: {
      fontFamily: {
        primary: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      },
      fontSize: {
        xs: "10px",
        sm: "12px", 
        md: "14px",
        lg: "16px",
        xl: "18px",
        xxl: "22px"
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700
      }
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem", 
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem"
    },
    borderRadius: {
      none: "0",
      sm: "0.125rem",
      md: "0.375rem", 
      lg: "0.5rem"
    }
  },
  
  layout: {
    type: "single-column",
    containerWidth: "794px",
    padding: "24px",
    gap: "20px"
  },
  
  components: [
    {
      id: "header",
      type: "Header",
      dataBinding: "info",
      position: {
        area: "main"
      },
      props: {
        title: "Header",
        iconType: "svg"
      },
      style: {
        textAlign: "left",
        backgroundColor: "transparent",
        color: "#1f2937"
      }
    },
    {
      id: "summary-section",
      type: "DefaultSection",
      dataBinding: "sections.summary",
      position: {
        area: "main"
      },
      props: {
        title: "Summary",
        titleClassName: "font-bold text-[1.1em] text-red-600 border-l-4 border-red-600 pl-3 mb-4",
        containerClassName: "ml-4"
      },
      fieldMap: {
        description: ["summary", "description"]
      }
    },
    {
      id: "experience-section",
      type: "DefaultSection",
      dataBinding: "sections.experience",
      position: {
        area: "main"
      },
      props: {
        title: "Experience",
        titleClassName: "font-bold text-[1.1em] text-red-600 border-l-4 border-red-600 pl-3 mb-4",
        containerClassName: "ml-4 space-y-4"
      },
      fieldMap: {
        mainTitle: ["company"],
        mainSubtitle: ["position"],
        secondarySubtitle: [],
        sideTitle: ["date"],
        sideSubtitle: ["location"],
        secondarySideSubtitle: [],
        description: ["summary", "description"]
      }
    },
    {
      id: "education-section",
      type: "DefaultSection", 
      dataBinding: "sections.education",
      position: {
        area: "main"
      },
      props: {
        title: "Education",
        titleClassName: "font-bold text-[1.1em] text-red-600 border-l-4 border-red-600 pl-3 mb-4",
        containerClassName: "ml-4 space-y-4"
      },
      fieldMap: {
        mainTitle: ["school"],
        mainSubtitle: ["degree"],
        secondarySubtitle: ["major"],
        sideTitle: ["date"],
        sideSubtitle: ["location"],
        secondarySideSubtitle: [],
        description: ["summary", "description"]
      }
    },
    {
      id: "projects-section",
      type: "DefaultSection",
      dataBinding: "sections.projects",
      position: {
        area: "main"
      },
      props: {
        title: "Projects",
        titleClassName: "font-bold text-[1.1em] text-red-600 border-l-4 border-red-600 pl-3 mb-4",
        containerClassName: "ml-4 space-y-4"
      },
      fieldMap: {
        mainTitle: ["name"],
        mainSubtitle: ["role"],
        secondarySubtitle: [],
        sideTitle: [],
        sideSubtitle: [],
        secondarySideSubtitle: [],
        description: ["summary", "description"]
      }
    },
    {
      id: "skills-section",
      type: "ListSection",
      dataBinding: "sections.skills",
      position: {
        area: "main"
      },
      props: {
        title: "Skills",
        titleClassName: "font-bold text-[1.1em] text-red-600 border-l-4 border-red-600 pl-3 mb-4",
        containerClassName: "ml-4 grid grid-cols-3 gap-4"
      },
      fieldMap: {
        itemName: ["skill", "name"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"]
      }
    },
    {
      id: "certificates-section",
      type: "ListSection",
      dataBinding: "sections.certificates",
      position: {
        area: "main"
      },
      props: {
        title: "Certifications",
        titleClassName: "font-bold text-[1.1em] text-red-600 border-l-4 border-red-600 pl-3 mb-4",
        containerClassName: "ml-4 grid grid-cols-2 gap-6"
      },
      fieldMap: {
        itemName: ["certificate", "name"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"]
      }
    },
    {
      id: "languages-section",
      type: "ListSection",
      dataBinding: "sections.languages",
      position: {
        area: "main"
      },
      props: {
        title: "Languages",
        titleClassName: "font-bold text-[1.1em] text-red-600 border-l-4 border-red-600 pl-3 mb-4",
        containerClassName: "ml-4 grid grid-cols-2 gap-4"
      },
      fieldMap: {
        itemName: ["language", "name"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"]
      }
    }
  ]
}; 