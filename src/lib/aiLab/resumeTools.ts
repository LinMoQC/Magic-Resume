import { Tool } from "langchain/tools";
import {
  createJdAnalysisChain,
  createPolishTextChain,
  CreateChatChainOptions,
  jdAnalysisSchema,
} from "./chains";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";;
import { createResumeAnalysisChain } from "./chains";

abstract class ResumeTool extends Tool {
  protected options: CreateChatChainOptions;

  constructor(options: CreateChatChainOptions) {
    super();
    this.options = options;
  }
}

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

export class JdAnalysisTool extends ResumeTool {
  name = "job-description-analyzer";
  description =
    "Use this tool to analyze a job description (JD) and extract key skills, responsibilities, and qualifications. The input must be the full text of the job description.";

  protected async _call(inputText: string): Promise<string> {
    try {
      const chain = createJdAnalysisChain(this.options);
      const result = await chain.invoke({
        jd: inputText,
      });
      return JSON.stringify(result, null, 2);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unknown error occurred";
      return `Error analyzing JD: ${message}`;
    }
  }
}

export class PolishTextTool extends ResumeTool {
  name = "text-polisher";
  description =
    "Use this tool to polish, rewrite, or improve any piece of text. It is ideal for refining resume bullet points, cover letters, or professional summaries.";

  protected async _call(inputText: string): Promise<string> {
    try {
      const chain = createPolishTextChain(this.options);
      // The polish text chain expects an object with a 'text' property.
      return await chain.invoke({ text: inputText });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unknown error occurred";
      return `Error polishing text: ${message}`;
    }
  }
} 