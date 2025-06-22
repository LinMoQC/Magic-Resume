import { MagicTemplateDSL } from '../types/magic-dsl';

export const cleanMinimalTemplate: MagicTemplateDSL = {
  id: "clean-minimal",
  name: "Clean Minimal",
  version: "1.0.0",
  description: "Clean and minimal single-column design with modern typography",
  thumbnailUrl: "/thumbnails/clean-minimal.png",
  tags: ["minimal", "clean", "single-column", "modern", "ats-friendly"],
  status: "PUBLISHED",
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#000000",
      secondary: "#374151", 
      text: "#000000",
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
      sm: "0",
      md: "0", 
      lg: "0"
    }
  },
  
  layout: {
    type: "single-column",
    containerWidth: "794px",
    padding: "24px",
    gap: "24px"
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
        textAlign: "center",
        backgroundColor: "transparent",
        color: "#000000"
      }
    },
    {
      id: "profiles-section",
      type: "ListSection",
      dataBinding: "sections.profiles",
      position: {
        area: "main"
      },
      props: {
        title: "Profiles",
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "grid grid-cols-3 gap-4"
      },
      fieldMap: {
        itemName: ["platform", "name"],
        itemDetail: ["username"],
        date: ["date"],
        summary: ["summary"]
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
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "space-y-2"
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
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "space-y-4"
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
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "space-y-4"
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
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "grid grid-cols-2 gap-6"
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
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "grid grid-cols-3 gap-4"
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
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "grid grid-cols-2 gap-6"
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
        titleClassName: "font-bold text-[1.1em] text-black border-b border-gray-200 pb-2 mb-4",
        containerClassName: "grid grid-cols-2 gap-4"
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