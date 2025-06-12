import { TemplateDSL } from "../types";

export const defaultTemplate: TemplateDSL = {
    "id": "default-classic",
    "name": "Default",
    "version": "1.0.0",
    "description": "A classic and professional serif-font template, ideal for academic and formal roles.",
    "thumbnailUrl": "/default-template.png",
    "tags": ["classic", "serif", "professional", "ats-friendly"],
    "status": "PUBLISHED",
    "createdAt": "2024-07-26T12:00:00.000Z",
    "updatedAt": "2024-07-26T12:00:00.000Z",
    "globalStyles": {
        "fontFamily": "\"IBM Plex Serif\", serif"
    },
    "layout": [
        {
            "component": "Header",
            "dataBinding": "info"
        },
        {
            "component": "DefaultSection",
            "dataBinding": "sections.experience",
            "props": {
                "title": "Experience"
            },
            "fieldMap": {
                "mainTitle": ["company", "project", "school", "name", "title", "platform"],
                "mainSubtitle": ["location", "major"],
                "secondarySubtitle": [],
                "sideTitle": ["date"],
                "sideSubtitle": ["position", "degree"],
                "secondarySideSubtitle": [],
                "description": ["summary", "description"]
            }
        },
        {
            "component": "DefaultSection",
            "dataBinding": "sections.education",
            "props": {
                "title": "Education"
            },
            "fieldMap": {
                "mainTitle": ["company", "project", "school", "name", "title", "platform"],
                "mainSubtitle": ["location", "major"],
                "secondarySubtitle": [],
                "sideTitle": ["date"],
                "sideSubtitle": ["position", "degree"],
                "secondarySideSubtitle": [],
                "description": ["summary", "description"]
            }
        },
        {
            "component": "DefaultSection",
            "dataBinding": "sections.projects",
            "props": {
                "title": "Projects"
            },
            "fieldMap": {
                "mainTitle": ["company", "project", "school", "name", "title", "platform"],
                "mainSubtitle": ["location", "major"],
                "secondarySubtitle": [],
                "sideTitle": ["date"],
                "sideSubtitle": ["position", "degree"],
                "secondarySideSubtitle": [],
                "description": ["summary", "description"]
            }
        },
        {
            "component": "ListSection",
            "dataBinding": "sections.skills",
            "props": {
                "title": "Skills"
            },
            "fieldMap": {
                "itemName": ["skill", "award", "language", "certificate", "name", "title"],
                "itemDetail": ["level"],
                "date": ["date"],
                "summary": ["summary"]
            }
        },
        {
            "component": "ListSection",
            "dataBinding": "sections.awards",
            "props": {
                "title": "Awards"
            },
            "fieldMap": {
                "itemName": ["skill", "award", "language", "certificate", "name", "title"],
                "itemDetail": ["level"],
                "date": ["date"],
                "summary": ["summary"]
            }
        },
        {
            "component": "ListSection",
            "dataBinding": "sections.languages",
            "props": {
                "title": "Languages"
            },
            "fieldMap": {
                "itemName": ["skill", "award", "language", "certificate", "name", "title"],
                "itemDetail": ["level"],
                "date": ["date"],
                "summary": ["summary"]
            }
        },
        {
            "component": "ListSection",
            "dataBinding": "sections.certificates",
            "props": {
                "title": "Certificates"
            },
            "fieldMap": {
                "itemName": ["skill", "award", "language", "certificate", "name", "title"],
                "itemDetail": ["level"],
                "date": ["date"],
                "summary": ["summary"]
            }
        }
    ]
}
