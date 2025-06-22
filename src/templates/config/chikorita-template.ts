import { MagicTemplateDSL } from '../types/magic-dsl';

export const chikoritaTemplate: MagicTemplateDSL = {
  id: "chikorita",
  name: "Chikorita",
  version: "1.0.0",
  description: "Fresh green theme with two-column layout",
  thumbnailUrl: "/thumbnails/chikorita.png",
  tags: ["modern", "two-column", "green", "fresh"],
  status: "PUBLISHED",
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  
  designTokens: {
    colors: {
      primary: "#22c55e",
      secondary: "#16a34a", 
      text: "#111827",
      textSecondary: "#6b7280",
      background: "#ffffff",
      border: "#d1d5db",
      sidebar: "#16a34a"
    },
    typography: {
      fontFamily: {
        primary: "'Inter', 'Arial', sans-serif"
      },
      fontSize: {
        xs: "10px",
        sm: "12px", 
        md: "14px",
        lg: "16px",
        xl: "18px",
        xxl: "24px"
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 600
      },
      lineHeight: 1.5,
      letterSpacing: "0px"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
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
    padding: "24px",
    gap: "24px",
    twoColumn: {
      leftWidth: "280px",
      rightWidth: "1fr",
      gap: "24px"
    }
  },
  
  components: [
    {
      id: "profile",
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
      id: "contact",
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
      id: "skills-sidebar",
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
      id: "languages-sidebar",
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
      id: "experience-main",
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
      }
    },
    {
      id: "education-main",
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
      id: "certificates-main",
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
      id: "projects-main",
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
      id: "profiles-main",
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