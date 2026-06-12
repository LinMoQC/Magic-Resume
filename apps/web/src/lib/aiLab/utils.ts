import { Resume } from "@/types/frontend/resume";

/**
 * Extracts all meaningful text from a resume object and concatenates it into a single string.
 * This is useful for providing a clean, text-only context to an LLM, free of HTML tags.
 * @param resume The resume data object.
 * @returns A single string containing all the textual content of the resume.
 */
export const extractTextFromResume = (resume: Resume): string => {
  let fullText = "";

  // Helper to safely add content with a separator
  const addContent = (content: string | undefined | null) => {
    if (content) {
      // Basic HTML tag removal
      const cleanedContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanedContent) {
        fullText += cleanedContent + "\\n\\n";
      }
    }
  };

  // Basic Info
  addContent(resume.info.fullName);
  addContent(resume.info.headline);
  addContent(resume.info.address);

  // Sections
  for (const key in resume.sections) {
    const section = resume.sections[key as keyof typeof resume.sections];
    if (Array.isArray(section)) {
      section.forEach(item => {
        // Add all string properties of an item
        Object.values(item).forEach(value => {
            if (typeof value === 'string') {
                addContent(value);
            }
        });
      });
    }
  }

  return fullText.trim();
}; 