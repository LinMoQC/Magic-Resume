import { MagicTemplateDSL } from '../types/magic-dsl';

export const productOpsFocusTemplate: MagicTemplateDSL = {
  id: "product-ops-focus",
  name: "Product Ops Focus",
  version: "1.0.0",
  description: "A concise template for product and operations roles with impact-first storytelling",
  thumbnailUrl: "/thumbnails/product-ops-focus.png",
  tags: ["product", "operations", "growth", "strategy", "single-column", "ats-friendly"],
  status: "PUBLISHED",
  createdAt: "2026-03-01T12:00:00.000Z",
  updatedAt: "2026-03-01T12:00:00.000Z",

  designTokens: {
    colors: {
      primary: "#0f766e",
      secondary: "#0ea5a6",
      text: "#111827",
      textSecondary: "#4b5563",
      background: "#ffffff",
      border: "#d1d5db",
      accent: "#14b8a6",
    },
    typography: {
      fontFamily: {
        primary: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      fontSize: {
        xs: "10px",
        sm: "12px",
        md: "14px",
        lg: "16px",
        xl: "18px",
        xxl: "24px",
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
      lineHeight: 1.6,
      letterSpacing: "0px",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "0.875rem",
      lg: "1.25rem",
      xl: "1.75rem",
    },
    borderRadius: {
      none: "0",
      sm: "0.125rem",
      md: "0.25rem",
      lg: "0.5rem",
    },
  },

  layout: {
    type: "single-column",
    containerWidth: "794px",
    padding: "12px",
    gap: "16px",
    showTitleDivider: true,
    showTitleIcon: true,
  },

  components: [
    {
      id: "header",
      type: "Header",
      dataBinding: "info",
      position: {
        area: "main",
      },
      props: {
        title: "Header",
        avatarPosition: "right",
        avatarWidth: 76,
        avatarHeight: 96,
        avatarRounded: false,
        contactStyle: "label",
        showCustomFields: true,
      },
      style: {
        textAlign: "left",
        backgroundColor: "transparent",
        color: "#111827",
      },
    },
    {
      id: "experience-section",
      type: "DefaultSection",
      dataBinding: "sections.experience",
      position: {
        area: "main",
      },
      props: {
        title: "Product & Operations Experience",
        containerClassName: "grid gap-x-6 gap-y-3",
      },
      fieldMap: {
        mainTitle: ["company", "project", "organization", "platform", "name", "title"],
        mainSubtitle: ["position", "role", "function", "location", "major"],
        secondarySubtitle: ["team", "scope"],
        sideTitle: ["date", "duration"],
        sideSubtitle: ["level", "degree"],
        secondarySideSubtitle: [],
        description: ["summary", "description", "achievement", "highlights"],
      },
    },
    {
      id: "projects-section",
      type: "DefaultSection",
      dataBinding: "sections.projects",
      position: {
        area: "main",
      },
      props: {
        title: "Key Projects",
        containerClassName: "grid gap-x-6 gap-y-3",
      },
      fieldMap: {
        mainTitle: ["name", "project", "title", "initiative"],
        mainSubtitle: ["role", "position", "owner"],
        secondarySubtitle: ["team", "scope"],
        sideTitle: ["date", "duration"],
        sideSubtitle: ["result", "impact"],
        secondarySideSubtitle: [],
        description: ["summary", "description", "achievement", "highlights"],
      },
    },
    {
      id: "skills-section",
      type: "ListSection",
      dataBinding: "sections.skills",
      position: {
        area: "main",
      },
      props: {
        title: "Core Competencies",
        containerClassName: "grid gap-x-6 gap-y-1",
      },
      fieldMap: {
        itemName: ["skill", "name", "title", "capability"],
        itemDetail: ["level", "proficiency"],
        date: ["date"],
        summary: ["summary", "description"],
      },
    },
    {
      id: "certificates-section",
      type: "ListSection",
      dataBinding: "sections.certificates",
      position: {
        area: "main",
      },
      props: {
        title: "Certifications",
        containerClassName: "grid gap-x-6 gap-y-1",
      },
      fieldMap: {
        itemName: ["certificate", "name", "title"],
        itemDetail: ["issuer", "level"],
        date: ["date"],
        summary: ["summary", "description"],
      },
    },
    {
      id: "education-section",
      type: "DefaultSection",
      dataBinding: "sections.education",
      position: {
        area: "main",
      },
      props: {
        title: "Education",
        containerClassName: "grid gap-x-6 gap-y-3",
      },
      fieldMap: {
        mainTitle: ["school", "name", "institution"],
        mainSubtitle: ["major", "department"],
        secondarySubtitle: [],
        sideTitle: ["date"],
        sideSubtitle: ["degree"],
        secondarySideSubtitle: [],
        description: ["summary", "description"],
      },
    },
    {
      id: "languages-section",
      type: "ListSection",
      dataBinding: "sections.languages",
      position: {
        area: "main",
      },
      props: {
        title: "Languages",
        containerClassName: "grid gap-x-6 gap-y-1",
      },
      fieldMap: {
        itemName: ["language", "name"],
        itemDetail: ["level"],
        date: ["date"],
        summary: ["summary"],
      },
    },
    {
      id: "profiles-section",
      type: "ListSection",
      dataBinding: "sections.profiles",
      position: {
        area: "main",
      },
      props: {
        title: "Links",
        containerClassName: "grid gap-x-6 gap-y-1",
      },
      fieldMap: {
        itemName: ["name", "platform", "title"],
        itemDetail: ["url", "username"],
        date: ["date"],
        summary: ["summary"],
      },
    },
  ],
};
