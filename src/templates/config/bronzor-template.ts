import { MagicTemplateDSL } from '../types/magic-dsl';

export const bronzorTemplate: MagicTemplateDSL = {
  id: "bronzor",
  name: "Bronzor",
  version: "1.0.0",
  description: "Classic single-column layout with professional typography",
  thumbnailUrl: "/thumbnails/bronzor.png",
  tags: ["classic", "single-column", "professional", "traditional"],
  status: "PUBLISHED",
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#000000",
      secondary: "#4a5568", 
      text: "#2d3748",
      textSecondary: "#718096",
      background: "#ffffff",
      border: "#e2e8f0"
    },
    typography: {
      fontFamily: {
        primary: "Times New Roman, Georgia, serif"
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
    padding: "48px",
    gap: "24px"
  },
  
  components: [
    {
      id: "header",
      type: "ProfileCard",
      dataBinding: "info",
      position: {
        area: "main",
      },
      props: {
        title: "Header"
      },
      style: {
        textAlign: "center",
        backgroundColor: "transparent",
        color: "#000000"
      }
    },
    {
      id: "experience-section",
      type: "Timeline",
      dataBinding: "sections.experience",
      position: {
        area: "main", 
      },
      props: {
        title: "EXPERIENCE"
      },
      fieldMap: {
        title: ["company"],
        subtitle: ["position"],
        date: ["date"],
        description: ["summary"]
      },
      style: {
        color: "#000000"
      }
    },
    {
      id: "education-section",
      type: "Timeline", 
      dataBinding: "sections.education",
      position: {
        area: "main",
      },
      props: {
        title: "EDUCATION"
      },
      fieldMap: {
        title: ["school"],
        subtitle: ["degree", "major"], 
        date: ["date"],
        description: ["summary"]
      },
      style: {
        color: "#000000"
      }
    },
    {
      id: "skills-section",
      type: "CompactList",
      dataBinding: "sections.skills",
      position: {
        area: "main",
      },
      props: {
        title: "SKILLS"
      },
      fieldMap: {
        title: ["name", "skill"]
      },
      style: {
        color: "#000000"
      }
    },
    {
      id: "projects-section",
      type: "Timeline",
      dataBinding: "sections.projects",
      position: {
        area: "main",
      },
      props: {
        title: "PROJECTS"
      },
      fieldMap: {
        title: ["name"],
        subtitle: ["role"],
        date: ["date"], 
        description: ["summary"]
      },
      style: {
        color: "#000000"
      }
    }
  ]
}; 