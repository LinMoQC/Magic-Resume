import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createResumeAnalysisChain } from "./chains";

const fullResumeOptimizerSchema = z.object({
  jd: z.string().describe("The job description content."),
  resumeData: z
    .object({})
    .passthrough()
    .describe(
      "The user's complete resume data in JSON format, including info, sections, etc."
    ),
});

export class FullResumeOptimizerTool extends DynamicStructuredTool {
  // @ts-expect-error - Tool constructor options are not perfectly typed
  constructor({ apiKey, baseUrl, modelName }) {
    super({
      name: "full-resume-optimizer",
      description: `
        Optimizes a full resume based on a job description. 
        This tool performs a comprehensive analysis and provides strategic recommendations.
        The input MUST be a single JSON string with 'jd' and 'resumeData' keys.
      `,
      schema: fullResumeOptimizerSchema,
      func: async ({ resumeData }) => {

        try {
          const analysisChain = createResumeAnalysisChain({
            apiKey,
            baseUrl,
            modelName,
          });
          const result = await analysisChain.invoke({
            resume: JSON.stringify(resumeData),
          });
          // We need to stringify it for the agent to process it as text.
          return JSON.stringify(result);
        } catch (error) {
          console.error("Error in FullResumeOptimizerTool:", error);
          return "An error occurred during resume optimization. Please check the logs.";
        }
      },
    });
  }
}
