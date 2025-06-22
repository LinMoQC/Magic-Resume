import { MagicTemplateDSL } from '../types/magic-dsl';

export const azurillTemplate: MagicTemplateDSL = {
  id: "azurill",
  name: "Azurill",
  version: "1.0.0",
  description: "Modern two-column layout with blue sidebar",
  thumbnailUrl: "/thumbnails/azurill.png",
  tags: ["modern", "two-column", "blue", "professional"],
  status: "PUBLISHED",
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#1e40af",
      secondary: "#3b82f6", 
      text: "#1f2937",
      textSecondary: "#6b7280",
      background: "#ffffff",
      border: "#d1d5db",
      sidebar: "#1e40af"
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
        xl: "20px",
        xxl: "24px"
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
    type: "two-column",
    containerWidth: "794px",
    padding: "0",
    gap: "0",
    twoColumn: {
      leftWidth: "280px",
      rightWidth: "514px", 
      gap: "0"
    }
  },
  
  components: [
    {
      id: "profile-card",
      type: "ProfileCard",
      dataBinding: "info",
      position: {
        area: "sidebar"
      },
      props: {
        title: "Profile"
      }
    },
    {
      id: "contact-info", 
      type: "ContactInfo",
      dataBinding: "info",
      position: {
        area: "sidebar"
      },
      props: {
        title: "Contact"
      }
    },
    {
      id: "skills-compact",
      type: "CompactList", 
      dataBinding: "sections.skills",
      position: {
        area: "sidebar"
      },
      props: {
        title: "Skills"
      },
      fieldMap: {
        title: ["name", "skill"]
      }
    },
    {
      id: "languages-compact",
      type: "CompactList",
      dataBinding: "sections.languages", 
      position: {
        area: "sidebar"
      },
      props: {
        title: "Languages"
      },
      fieldMap: {
        title: ["language", "name"]
      }
    },
    {
      id: "experience-timeline",
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
      }
    },
    {
      id: "education-timeline",
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
      }
    },
    {
      id: "languages-timeline",
      type: "Timeline",
      dataBinding: "sections.languages",
      position: {
        area: "main"
      },
      props: {
        title: "Languages"
      },
      fieldMap: {
        title: ["language", "name"],
        subtitle: ["level"],
        date: ["date"],
        description: ["summary"]
      }
    },
    {
      id: "certificates-timeline",
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
      }
    },
    {
      id: "projects-timeline",
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
      }
    },
    {
      id: "profiles-timeline",
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
      }
    }
  ]
}; 