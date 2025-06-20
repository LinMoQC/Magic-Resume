import { TemplateDSL } from "../types";

const commonFields = {
  mainTitle: ["company", "project", "school", "name", "title", "platform"],
  mainSubtitle: ["location", "major"],
  secondarySubtitle: [],
  sideTitle: ["date"],
  sideSubtitle: ["position", "degree"],
  secondarySideSubtitle: [],
  description: ["summary", "description"],
};

const listFields = {
  itemName: ["skill", "award", "language", "certificate", "name", "title"],
  itemDetail: ["level"],
  date: ["date"],
  summary: ["summary"],
};

export const defaultClassicTemplate: TemplateDSL = {
  id: "default-classic",
  name: "Default Classic",
  version: "1.0.0",
  description: "A classic and professional serif-font template, ideal for academic and formal roles.",
  thumbnailUrl: "/thumbnails/default-classic.png",
  tags: ["classic", "serif", "professional", "ats-friendly"],
  status: 'PUBLISHED',
  createdAt: "2025-01-20T12:00:00.000Z",
  updatedAt: "2025-01-20T12:00:00.000Z",
  globalStyles: {
    fontFamily: '"IBM Plex Serif", serif',
  },
  layout: [
    {
      component: "Header",
      dataBinding: "info",
    },
    {
      component: "DefaultSection",
      dataBinding: "sections.experience",
      props: { title: "Experience" },
      fieldMap: commonFields,
    },
    {
      component: "DefaultSection",
      dataBinding: "sections.education",
      props: { title: "Education" },
      fieldMap: commonFields,
    },
    {
      component: "DefaultSection",
      dataBinding: "sections.projects",
      props: { title: "Projects" },
      fieldMap: commonFields,
    },
    {
      component: "ListSection",
      dataBinding: "sections.skills",
      props: { title: "Skills" },
      fieldMap: listFields,
    },
    {
      component: "ListSection",
      dataBinding: "sections.awards",
      props: { title: "Awards" },
      fieldMap: listFields,
    },
    {
      component: "ListSection",
      dataBinding: "sections.languages",
      props: { title: "Languages" },
      fieldMap: listFields,
    },
    {
      component: "ListSection",
      dataBinding: "sections.certificates",
      props: { title: "Certificates" },
      fieldMap: listFields,
    },
  ],
}; 