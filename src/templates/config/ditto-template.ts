import { MagicTemplateDSL } from '../types/magic-dsl';

export const dittoTemplate: MagicTemplateDSL = {
  id: "ditto",
  name: "Ditto",
  version: "1.0.0",
  description: "Modern card-based layout with elegant spacing",
  thumbnailUrl: "/thumbnails/ditto.png",
  tags: ["modern", "cards", "minimalist", "elegant"],
  status: "PUBLISHED",
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6", 
      text: "#1f2937",
      textSecondary: "#6b7280",
      background: "#f9fafb",
      border: "#e5e7eb"
    },
    typography: {
      fontFamily: {
        primary: "'Roboto', 'Segoe UI', sans-serif"
      },
      fontSize: {
        xs: "11px",
        sm: "13px", 
        md: "15px",
        lg: "17px",
        xl: "20px",
        xxl: "26px"
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 600
      }
    },
    spacing: {
      xs: "0.375rem",
      sm: "0.75rem", 
      md: "1.25rem",
      lg: "2rem",
      xl: "2.5rem"
    },
    borderRadius: {
      none: "0",
      sm: "0.25rem",
      md: "0.5rem", 
      lg: "0.75rem"
    }
  },
  
  layout: {
    type: "single-column",
    containerWidth: "794px",
    padding: "32px",
    gap: "32px"
  },
  
  components: [
    {
      id: "header-card",
      type: "ProfileCard",
      dataBinding: "info",
      position: {
        area: "main"
      },
      props: {
        title: "Profile"
      },
      style: {
        backgroundColor: "#ffffff",
        color: "#1f2937",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    },
    {
      id: "experience-card",
      type: "Timeline",
      dataBinding: "sections.experience",
      position: {
        area: "main"
      },
      props: {
        title: "Professional Experience"
      },
      fieldMap: {
        title: ["company"],
        subtitle: ["position"],
        date: ["date"],
        description: ["summary"]
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    },
    {
      id: "education-card",
      type: "Timeline", 
      dataBinding: "sections.education",
      position: {
        area: "main"
      },
      props: {
        title: "Education"
      },
      fieldMap: {
        title: ["school"],
        subtitle: ["degree", "major"], 
        date: ["date"],
        description: ["summary"]
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    },
    {
      id: "certificates-card",
      type: "Timeline",
      dataBinding: "sections.certificates",
      position: {
        area: "main"
      },
      props: {
        title: "Certificates"
      },
      fieldMap: {
        title: ["certificate", "name"],
        subtitle: ["level"],
        date: ["date"],
        description: ["summary"]
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    },
    {
      id: "skills-card",
      type: "CompactList",
      dataBinding: "sections.skills",
      position: {
        area: "main"
      },
      props: {
        title: "Technical Skills"
      },
      fieldMap: {
        title: ["name", "skill"]
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    },
    {
      id: "languages-card",
      type: "CompactList",
      dataBinding: "sections.languages",
      position: {
        area: "main"
      },
      props: {
        title: "Languages"
      },
      fieldMap: {
        title: ["language", "name"],
        level: ["level"]
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    },
    {
      id: "projects-card",
      type: "Timeline",
      dataBinding: "sections.projects",
      position: {
        area: "main"
      },
      props: {
        title: "Projects"
      },
      fieldMap: {
        title: ["name"],
        subtitle: ["role"],
        date: ["date"], 
        description: ["summary"]
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    },
    {
      id: "profiles-card",
      type: "Timeline",
      dataBinding: "sections.profiles",
      position: {
        area: "main"
      },
      props: {
        title: "Profiles"
      },
      fieldMap: {
        title: ["name", "platform"],
        subtitle: ["username"],
        date: ["date"],
        description: ["summary"]
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }
    }
  ]
}; 