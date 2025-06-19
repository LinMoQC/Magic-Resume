/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { END, StateGraph, START } from "@langchain/langgraph";
import {
  CreateChatChainOptions,
  createSubAnalysisChain,
  createJdAnalysisChain,
  JdAnalysis,
} from "./chains";
import { getModel } from "./aiService";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { Resume } from "@/store/useResumeStore";
import { extractTextFromResume } from "./utils";
import { ANALYSIS_CATEGORIES } from "@/prompts/resume-analysis-prompt";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";

// Prompts for multi-step research
const queryWriterPrompt = `Your goal is to generate sophisticated and diverse web search queries. These queries are intended for an advanced automated web research tool capable of analyzing complex results, following links, and synthesizing information.

Instructions:
- Always prefer a single search query, only add another query if the original question requests multiple aspects or elements and one query is not enough.
- Each query should focus on one specific aspect of the original question.
- Don't produce more than 3 queries.
- Queries should be diverse, if the topic is broad, generate more than 1 query.
- Don't generate multiple similar queries, 1 is enough.

Format: 
{format_instructions}

Context: {research_topic}`;

const reflectionPrompt = `You are a pragmatic and efficient research analyst. Your primary goal is to **conclusively answer the user's research topic** using the provided summaries. Your secondary goal is to identify *critical* knowledge gaps **only if** the summaries are insufficient to form a complete and high-quality answer.

**Your Decision-Making Process:**
1.  First, carefully review the original research topic: "{research_topic}".
2.  Second, analyze all the provided summaries to see what information has been gathered.
3.  Third, make a decision: **Can you write a comprehensive, well-supported, and high-quality answer to the research topic RIGHT NOW with the existing information?**

-   **If YES, the information is SUFFICIENT.** Your job is to stop the research. Set "is_sufficient" to true and leave "follow_up_queries" as an empty array. Do not generate any new questions.
-   **If NO, the information is INSUFFICIENT.** Pinpoint the specific, most critical missing pieces of information. Generate a *minimal* number of concise follow-up queries that directly target these gaps. Avoid asking for nice-to-have details; only ask for what is essential.

**Output Format:**
You MUST produce your output in the JSON format described below.
{format_instructions}

**Provided Information for Analysis:**

Research Topic: "{research_topic}"

Summaries:
{summaries}`;

const answerPrompt = `You are the final step of a multi-step research process. Your task is to synthesize the provided summaries into a comprehensive, high-quality answer to the user's research topic.

**IMPORTANT:** Your output MUST be a valid JSON object.

Here is the structure you MUST follow:
{{
  "webSearchResults": "Your comprehensive, well-structured, and markdown-formatted answer goes here. You MUST include all the citations from the summaries in the answer correctly."
}}

User Context (Research Topic):
- {research_topic}

Summaries:
{summaries}`;

type SubAnalysisResult = {
  score: number;
  justification: string;
  suggestions: string[];
};

/**
 * Defines the state for the resume optimization graph.
 * It holds all the data that flows through the graph's nodes.
 */
export interface GraphState {
  jd: string;
  resume: Resume;
  resumeText: string;
  jdAnalysis?: JdAnalysis;
  analysisReport?: Record<string, unknown>;
  parallelAnalysisResults?: Record<string, SubAnalysisResult>;
  webSearchResults?: string;
  
  // Multi-step research state
  research_topic?: string;
  queries?: string[];
  summaries?: string[];
  knowledge_gap?: string;
  reflection_count?: number;

  // State for iterative analysis
  analysisTasks?: string[];
  currentAnalysisTask?: string;

  // State for iterative rewriting
  rewriteTasks: string[];
  currentTask?: string;
  optimizedSections: Record<string, unknown>;

  optimizedResume?: Resume;
  error?: string;
  taskCompleted?: string;
  is_graph_complete?: boolean;
}

const analysisCategories = Object.keys(ANALYSIS_CATEGORIES);

const queryWriterParser = StructuredOutputParser.fromZodSchema(
  z.object({
    rationale: z.string().describe("Brief explanation of why these queries are relevant"),
    query: z.array(z.string()).describe("A list of search queries"),
  })
);

const reflectionParser = StructuredOutputParser.fromZodSchema(
  z.object({
    is_sufficient: z.boolean().describe("true or false"),
    knowledge_gap: z.string().describe("Describe what information is missing or needs clarification. If is_sufficient is true, this can be an empty string."),
    follow_up_queries: z.array(z.string()).describe("An array of specific questions to address the gap. This should be an empty array if is_sufficient is true."),
  })
);

// --- NODES ---
// These nodes are shared across different graphs.

const prepareInputsNode = (state: GraphState): Partial<GraphState> => {
  const resumeText = extractTextFromResume(state.resume);
  return { resumeText };
}

const jdAnalysisNode = async (state: GraphState, config: CreateChatChainOptions): Promise<Partial<GraphState>> => {
  try {
    console.log("--- Analyzing Job Description ---");
    const { jd } = state;
    const jdChain = createJdAnalysisChain(config);
    const jdAnalysis = await jdChain.invoke({ jd });
    console.log("--- JD Analysis Complete ---");
    return { jdAnalysis };
  } catch (e) {
    console.error("Error in jdAnalysisNode:", e);
    return { error: "Failed to analyze job description." };
  }
}

const prepareResearchNode = (state: GraphState): Partial<GraphState> => {
  console.log("--- Preparing Research ---");
  const { jdAnalysis } = state;
  if (!jdAnalysis || !jdAnalysis.jobTitle) {
    return { error: "Cannot prepare research without job title." };
  }
  const skillsPart = jdAnalysis.keySkills?.join(", ");
  const research_topic = `Key responsibilities, qualifications, and technologies for a ${jdAnalysis.jobTitle}${skillsPart ? ` with skills in ${skillsPart}` : ''}.`;
  return { research_topic, summaries: [], reflection_count: 0 };
};

const queryWriterNode = async (state: GraphState, config: CreateChatChainOptions): Promise<Partial<GraphState>> => {
  console.log("--- Writing Search Queries ---");
  const { research_topic } = state;
  if (!config.apiKey) throw new Error("API key is required.");
  const llm = getModel({ ...config, apiKey: config.apiKey });
  const prompt = new PromptTemplate({
    template: queryWriterPrompt,
    inputVariables: ["research_topic"],
    partialVariables: { format_instructions: queryWriterParser.getFormatInstructions() },
  });
  const queryChain = prompt.pipe(llm).pipe(queryWriterParser);
  const result = await queryChain.invoke({ research_topic });
  return { queries: result.query };
}

const webSearchNode = async (state: GraphState): Promise<Partial<GraphState>> => {
  console.log("--- Performing Web Search ---");
  const { queries, summaries } = state;
  if (!queries || queries.length === 0) {
    return { summaries: summaries };
  }
  const searchTool = new TavilySearch({ maxResults: 3 });
  const searchResults = await Promise.all(queries.map(q => searchTool.invoke({ query: q })));
  const newSummaries = searchResults.flat();
  const allSummaries = (summaries || []).concat(newSummaries);
  return { summaries: allSummaries, queries: [] }; 
}

const reflectionNode = async (state: GraphState, config: CreateChatChainOptions): Promise<Partial<GraphState>> => {
  console.log("--- Reflecting on Search Results ---");
  const { research_topic, summaries } = state;
  if (!config.apiKey) throw new Error("API key is required.");
  const llm = getModel({ ...config, apiKey: config.apiKey });
  const prompt = new PromptTemplate({
    template: reflectionPrompt,
    inputVariables: ["research_topic", "summaries"],
    partialVariables: { format_instructions: reflectionParser.getFormatInstructions() },
  });
  const reflectionChain = prompt.pipe(llm).pipe(reflectionParser);
  const result = await reflectionChain.invoke({ research_topic, summaries: JSON.stringify(summaries) });
  const reflection_count = (state.reflection_count || 0) + 1;

  if (result.is_sufficient) {
    return { knowledge_gap: "sufficient", reflection_count };
  } else {
    return { knowledge_gap: result.knowledge_gap, queries: result.follow_up_queries, reflection_count };
  }
};

const shouldContinueResearch = (state: GraphState): "continue" | "end" => {
  const MAX_REFLECTIONS = 2;
  if ((state.reflection_count || 0) >= MAX_REFLECTIONS) {
    console.log(`--- Reached max reflections (${MAX_REFLECTIONS}), ending research loop. ---`);
    return "end";
  }
  return state.knowledge_gap === "sufficient" || !state.queries || state.queries.length === 0 ? "end" : "continue";
}

const finalAnswerNode = async (state: GraphState, config: CreateChatChainOptions): Promise<Partial<GraphState>> => {
  console.log("--- Generating Final Answer ---");
  const { research_topic, summaries } = state;
  if (!config.apiKey) throw new Error("API key is required.");
  const llm = getModel({ ...config, apiKey: config.apiKey });
  const prompt = new PromptTemplate({ template: answerPrompt, inputVariables: ["research_topic", "summaries"] });
  const answerChain = prompt.pipe(llm).pipe(new JsonOutputParser<{webSearchResults: string}>());
  const finalAnswer = await answerChain.invoke({ research_topic, summaries: JSON.stringify(summaries) });
  console.log("--- Final Answer Generated ---", finalAnswer);
  return { webSearchResults: finalAnswer.webSearchResults };
}

const prepareAnalysisTasksNode = (): Partial<GraphState> => {
  console.log("--- Preparing Analysis Tasks ---");
  return { analysisTasks: analysisCategories, parallelAnalysisResults: {} };
}

const analyzeSingleCategoryNode = async (state: GraphState, config: CreateChatChainOptions): Promise<Partial<GraphState>> => {
  const { resume, jdAnalysis, currentAnalysisTask, webSearchResults } = state;
  if (!currentAnalysisTask) throw new Error("Current analysis task is missing.");

  console.log(`--- Analyzing Category: ${currentAnalysisTask} ---`);
  const subChain = createSubAnalysisChain(config, currentAnalysisTask);
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    const result = await subChain.invoke({
      resume: JSON.stringify(resume),
      jd_analysis: JSON.stringify(jdAnalysis),
      web_search_results: JSON.stringify(webSearchResults),
    });
    return {
      parallelAnalysisResults: {
        ...state.parallelAnalysisResults,
        [currentAnalysisTask]: result as SubAnalysisResult,
      },
    };
  } catch (e) {
    console.error(`Error analyzing category ${currentAnalysisTask}:`, e);
    return {
      parallelAnalysisResults: {
        ...state.parallelAnalysisResults,
        [currentAnalysisTask]: { score: 0, justification: "Analysis failed.", suggestions: [] },
      },
    };
  }
};

const route_next_analysis = (state: GraphState): Partial<GraphState> => {
  const tasks = state.analysisTasks || [];
  if (tasks.length === 0) {
    return { currentAnalysisTask: undefined };
  }
  const nextTask = tasks[0];
  const remainingTasks = tasks.slice(1);
  return { currentAnalysisTask: nextTask, analysisTasks: remainingTasks };
}

const should_continue_analysis = (state: GraphState): "continue" | "end" => {
  return state.currentAnalysisTask ? "continue" : "end";
};

const combineAnalysisNode = (state: GraphState): Partial<GraphState> => {
  console.log("--- Combining Analysis Results ---");
  if (!state.parallelAnalysisResults) {
    return { error: "Cannot combine results, parallel analysis results are missing." };
  }
  const analysisReport = {
    ...state.analysisReport,
    detailedAnalysis: state.parallelAnalysisResults,
  };
  return { analysisReport };
}

const prepareRewriteTasksNode = (state: GraphState): Partial<GraphState> => {
  console.log("--- Preparing Rewrite Tasks ---");
  const { resume } = state;
  const rewriteTasks = resume.sectionOrder
    .map(s => s.key)
    .filter(key => {
      if (key === 'basics') return false;
      const sectionData = resume.sections[key as keyof typeof resume.sections];
      if (Array.isArray(sectionData) && sectionData.length === 0) {
        return false;
      }
      return true;
    });
  return { rewriteTasks, optimizedSections: {} };
}

const rewriteSectionNode = async (state: GraphState, config: CreateChatChainOptions): Promise<Partial<GraphState>> => {
  let attempts = 0;
  const MAX_RETRIES = 2;

  const { analysisReport, resume, currentTask } = state;
  if (!analysisReport || !currentTask || !config.apiKey) {
    throw new Error("Missing required data for section rewrite.");
  }

  console.log(`--- Rewriting Section: ${currentTask} ---`);

  const llm = getModel({ ...config, apiKey: config.apiKey });
  const sectionData = resume.sections[currentTask as keyof typeof resume.sections];
  const analysisData = analysisReport;

  while (attempts < MAX_RETRIES) {
    try {
      const sectionRewritePrompt = `
        You are an expert resume editor. Rewrite the following section of a resume based on the analysis report and web search results.
        
        **Crucial Instruction: You MUST preserve the original language of the text.** If the original section is in Chinese, the rewritten section must also be in Chinese. If it's in English, it must remain in English. Do not translate the content to a different language.

        - Section to rewrite: {section}
        - Relevant analysis: {analysis}
        - Relevant web search results about the role: {web_search_results}
        - Output ONLY the rewritten section JSON. Your output must be a single, valid JSON object. Do not include any markdown, comments, code block fences (\`\`\`json), or trailing commas.

        Original Section JSON:
        \`\`\`json
        {section}
        \`\`\`

        Analysis:
        \`\`\`json
        {analysis}
        \`\`\`

        Web Search Results:
        \`\`\`
        {web_search_results}
        \`\`\`

        Rewritten Section JSON:
      `;
      const prompt = new PromptTemplate({
        template: sectionRewritePrompt,
        inputVariables: ["section", "analysis", "web_search_results"],
      });
      const rewriteChain = prompt.pipe(llm).pipe(new JsonOutputParser());

      const rewrittenSection = await rewriteChain.invoke({
        section: JSON.stringify(sectionData),
        analysis: JSON.stringify(analysisData),
        web_search_results: JSON.stringify(state.webSearchResults),
      });

      return {
        optimizedSections: {
          ...state.optimizedSections,
          [currentTask]: rewrittenSection,
        },
        taskCompleted: currentTask,
      };
    } catch (e: unknown) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        console.error(`Failed to rewrite section ${currentTask} after ${MAX_RETRIES} attempts.`, e);
        return { error: `Failed to rewrite section ${currentTask}.` };
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return { error: `Failed to rewrite section ${currentTask} after all retries.` };
};

const combineSectionsNode = (state: GraphState): Partial<GraphState> => {
  console.log("--- Combining Rewritten Sections ---");
  const optimizedResume = JSON.parse(JSON.stringify(state.resume)); // Deep copy
  for (const sectionKey in state.optimizedSections) {
    optimizedResume.sections[sectionKey] = state.optimizedSections[sectionKey];
  }
  return { optimizedResume };
}

const routeNextSectionNode = (state: GraphState): Partial<GraphState> => {
  const tasks = state.rewriteTasks;
  if (tasks.length === 0) {
    return { currentTask: undefined, rewriteTasks: [] };
  }
  const nextTask = tasks[0];
  const remainingTasks = tasks.slice(1);
  return { currentTask: nextTask, rewriteTasks: remainingTasks };
}

const shouldContinueRewrite = (state: GraphState): "continue" | "end" => {
  return state.currentTask ? "continue" : "end";
};

const getChannels = () => ({
  jd: { value: (x: any, y: any) => y, default: () => "" },
  resume: { value: (x: any, y: any) => y, default: () => ({} as Resume) },
  resumeText: { value: (x: any, y: any) => y, default: () => "" },
  jdAnalysis: { value: (x: any, y: any) => y, default: () => undefined },
  analysisReport: { value: (x: any, y: any) => y, default: () => ({}) },
  parallelAnalysisResults: { value: (x: any, y: any) => y, default: () => ({}) },
  webSearchResults: { value: (x: any, y: any) => y, default: () => undefined },
  research_topic: { value: (x: any, y: any) => y, default: () => undefined },
  queries: { value: (x: any, y: any) => y, default: () => [] },
  summaries: { value: (x: any, y: any) => y, default: () => [] },
  knowledge_gap: { value: (x: any, y: any) => y, default: () => undefined },
  reflection_count: { value: (x: any, y: any) => y, default: () => 0 },
  analysisTasks: { value: (x: any, y: any) => y, default: () => [] },
  currentAnalysisTask: { value: (x: any, y: any) => y, default: () => undefined },
  rewriteTasks: { value: (x: any, y: any) => y, default: () => [] },
  currentTask: { value: (x: any, y: any) => y, default: () => undefined },
  optimizedSections: { value: (x: any, y: any) => y, default: () => ({}) },
  optimizedResume: { value: (x: any, y: any) => y, default: () => ({} as Resume) },
  error: { value: (x: any, y: any) => y, default: () => undefined },
  taskCompleted: { value: (x: any, y: any) => y, default: () => undefined },
  is_graph_complete: { value: (x: any, y: any) => y, default: () => undefined },
});

// --- GRAPHS ---

const graphCompleteNode = (state: GraphState) => {
  console.log("--- End of Graph ---");
  return { is_graph_complete: true, webSearchResults: state.webSearchResults };
}

export const createResearchGraph = (config: CreateChatChainOptions) => {
  const workflow = new StateGraph<GraphState>({ channels: getChannels() })
    .addNode("preparer", prepareInputsNode)
    .addNode("jd_analyzer", (state) => jdAnalysisNode(state, config))
    .addNode("prepare_research", prepareResearchNode)
    .addNode("query_writer", (state) => queryWriterNode(state, config))
    .addNode("web_searcher", webSearchNode)
    .addNode("reflection", (state) => reflectionNode(state, config))
    .addNode("final_answer", (state) => finalAnswerNode(state, config))
    .addNode("graph_complete", graphCompleteNode);

  workflow
    .addEdge(START, "preparer")
    .addEdge("preparer", "jd_analyzer")
    .addEdge("jd_analyzer", "prepare_research")
    .addEdge("prepare_research", "query_writer")
    .addEdge("query_writer", "web_searcher")
    .addEdge("web_searcher", "reflection")
    .addConditionalEdges("reflection", shouldContinueResearch, {
      continue: "web_searcher",
      end: "final_answer",
    })
    .addEdge("final_answer", "graph_complete")
    .addEdge("graph_complete", END);

  return workflow.compile();
};

export const createAnalysisGraph = (config: CreateChatChainOptions) => {
  const workflow = new StateGraph<GraphState>({ channels: getChannels() })
    .addNode("prepare_analyzer", prepareAnalysisTasksNode)
    .addNode("analyze_category", (state) => analyzeSingleCategoryNode(state, config))
    .addNode("route_next_analysis", route_next_analysis)
    .addNode("combiner", combineAnalysisNode);

  workflow
    .addEdge(START, "prepare_analyzer")
    .addEdge("prepare_analyzer", "route_next_analysis")
    .addConditionalEdges("route_next_analysis", should_continue_analysis, {
      continue: "analyze_category",
      end: "combiner",
    })
    .addEdge("analyze_category", "route_next_analysis")
    .addEdge("combiner", END);

  return workflow.compile();
};

export const createRewriteGraph = (config: CreateChatChainOptions) => {
  const workflow = new StateGraph<GraphState>({ channels: getChannels() })
    .addNode("prepare_rewriter", prepareRewriteTasksNode)
    .addNode("rewrite_section", (state) => rewriteSectionNode(state, config))
    .addNode("combine_sections", combineSectionsNode)
    .addNode("route_next_section", routeNextSectionNode);

  workflow
    .addEdge(START, "prepare_rewriter")
    .addEdge("prepare_rewriter", "route_next_section")
    .addConditionalEdges("route_next_section", shouldContinueRewrite, {
      "continue": "rewrite_section",
      "end": "combine_sections",
    })
    .addEdge("rewrite_section", "route_next_section") // Loop back
    .addEdge("combine_sections", END);
  
  return workflow.compile();
};