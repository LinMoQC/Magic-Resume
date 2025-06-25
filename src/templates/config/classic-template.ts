import { MagicTemplateDSL } from '../types/magic-dsl';

export const classicTemplate: MagicTemplateDSL = {
  id: "classic",
  name: "Classic",
  version: "1.0.0",
  description: "A classic and professional serif-font template, ideal for academic and formal roles",
  thumbnailUrl: "/thumbnails/classic.png",
  tags: ["classic", "serif", "professional", "ats-friendly"],
  status: "PUBLISHED",
  createdAt: "2024-07-26T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#3b82f6",
      secondary: "#333333", 
      text: "#000000",
      textSecondary: "#666666",
      background: "#ffffff",
      border: "#cccccc"
    },
    typography: {
      fontFamily: {
        primary: '"IBM Plex Serif", serif'
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
      },
      lineHeight: 1.6,
      letterSpacing: "0px"
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem", 
      md: "1rem",
      lg: "1rem",
      xl: "1.5rem"
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
    padding: "12px",  // 减少内边距，匹配原始的 p-3
    gap: "16px"       // 减少组件间距
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
        color: "#000000"
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
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-3"
      },
      fieldMap: {
        mainTitle: ["company", "project", "school", "name", "title", "platform"],
        mainSubtitle: ["location", "major"],
        secondarySubtitle: [],
        sideTitle: ["date"],
        sideSubtitle: ["position", "degree"],
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
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-3"
      },
      fieldMap: {
        mainTitle: ["company", "project", "school", "name", "title", "platform"],
        mainSubtitle: ["location", "major"],
        secondarySubtitle: [],
        sideTitle: ["date"],
        sideSubtitle: ["position", "degree"],
        secondarySideSubtitle: [],
        description: ["summary", "description"]
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
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-1"
      },
      fieldMap: {
        itemName: ["skill", "award", "language", "certificate", "name", "title"],
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
        title: "Certificates",
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-1"
      },
      fieldMap: {
        itemName: ["skill", "award", "language", "certificate", "name", "title"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"]
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
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-3"
      },
      fieldMap: {
        mainTitle: ["name", "project", "title"],
        mainSubtitle: ["location", "major"],
        secondarySubtitle: [],
        sideTitle: ["date"],
        sideSubtitle: ["role", "position"],
        secondarySideSubtitle: [],
        description: ["summary", "description"]
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
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-1"
      },
      fieldMap: {
        itemName: ["skill", "award", "language", "certificate", "name", "title"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"]
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
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-1"
      },
      fieldMap: {
        itemName: ["skill", "award", "language", "certificate", "name", "title"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"]
      }
    },
    {
      id: "awards-section",
      type: "ListSection",
      dataBinding: "sections.awards",
      position: {
        area: "main"
      },
      props: {
        title: "Awards",
        titleClassName: "font-bold text-primary text-[1.2em] text-blue-500",
        containerClassName: "grid gap-x-6 gap-y-1"
      },
      fieldMap: {
        itemName: ["skill", "award", "language", "certificate", "name", "title"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"]
      }
    }
  ]
}; 