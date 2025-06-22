import { MagicTemplateDSL } from '../types/magic-dsl';

export const gengarTemplate: MagicTemplateDSL = {
  id: "gengar",
  name: "Gengar",
  version: "1.0.0",
  description: "Dark theme with purple accents and sophisticated typography",
  thumbnailUrl: "/thumbnails/gengar.png",
  tags: ["dark", "modern", "purple", "sophisticated"],
  status: "PUBLISHED",
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#8b5cf6",
      secondary: "#a855f7", 
      text: "#f9fafb",
      textSecondary: "#d1d5db",
      background: "#111827",
      border: "#374151",
      sidebar: "#1f2937"
    },
    typography: {
      fontFamily: {
        primary: "'Montserrat', 'Arial', sans-serif"
      },
      fontSize: {
        xs: "10px",
        sm: "12px", 
        md: "14px",
        lg: "16px",
        xl: "19px",
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
      md: "0.25rem", 
      lg: "0.375rem"
    }
  },
  
  layout: {
    type: "two-column",
    containerWidth: "794px",
    padding: "24px",
    gap: "24px",
    twoColumn: {
      leftWidth: "250px",
      rightWidth: "1fr",
      gap: "24px"
    }
  },
  
  components: [
    {
      id: "profile-dark",
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
      id: "contact-dark",
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
      id: "skills-dark",
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
      id: "languages-dark",
      type: "CompactList",
      dataBinding: "sections.languages",
      position: {
        area: "sidebar"
      },
      props: {
        title: "Languages"
      },
      fieldMap: {
        title: ["language", "name"],
        level: ["level"]
      }
    },
    {
      id: "experience-dark",
      type: "Timeline",
      dataBinding: "sections.experience",
      position: {
        area: "main"
      },
      props: {
        title: "Work Experience"
      },
      fieldMap: {
        title: ["company"],
        subtitle: ["position"],
        date: ["date"],
        description: ["summary"]
      },
      style: {
        color: "#f9fafb"
      }
    },
    {
      id: "education-dark",
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
        color: "#f9fafb"
      }
    },
    {
      id: "certificates-dark",
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
        color: "#f9fafb"
      }
    },
    {
      id: "projects-dark",
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
        color: "#f9fafb"
      }
    },
    {
      id: "profiles-dark",
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
        color: "#f9fafb"
      }
    }
  ]
}; 