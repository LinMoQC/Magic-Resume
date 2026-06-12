import { TavilySearch } from "@langchain/tavily";
import { AgentExecutor, createOpenAIToolsAgent, createToolCallingAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { getModel } from "./aiService";
import { Runnable, RunnableSequence } from "@langchain/core/runnables";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { FullResumeOptimizerTool } from "./resumeTools";

interface CreateAgentOptions {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
}

const agentPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful research assistant. You have access to a web search tool and you should use it to answer user questions. Provide concise and informative answers."],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const careerAgentPrompt = ChatPromptTemplate.fromMessages([
  ["system",
  `You are a powerful career assistant. Your goal is to help users with their job applications, resume optimization, and career research.

You have access to the following tools:
- tavily: Use for general career or company research questions.
- full-resume-optimizer: Use this when a user asks to optimize their resume based on a job description. The input for this tool MUST be a single JSON string containing both the 'jd' and 'resumeData' keys.

Carefully analyze the user's request to choose the most appropriate tool.`
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const resumeExpertAgentPrompt = ChatPromptTemplate.fromMessages([
  ["system",
  `You are a world-class resume optimization expert and career coach. Your goal is to conduct a comprehensive and in-depth analysis of a user's resume against a specific job description (JD) and then generate an optimized version of the resume.

You have access to ONE powerful tool:
- full-resume-optimizer: This is your primary tool for analysis. It takes the user's resume data and the JD, and returns a JSON object containing a detailed analysis report (scores, justifications, suggestions).

Your operational workflow MUST be as follows:
1.  Receive the user's request, which includes both the resume and the JD.
2.  Immediately call the 'full-resume-optimizer' tool with the provided 'jd' and 'resumeData'.
3.  The tool will return a JSON string containing the full analysis report.
4.  Critically review the analysis report you receive from the tool.
5.  Based on the "suggestions" and your own expert knowledge, generate a fully optimized version of the original resumeData.
6.  Your final output to the user MUST be a single, valid JSON object containing two keys:
    - "analysisReport": The analysis JSON object you received from the tool.
    - "optimizedResume": The complete, rewritten, and optimized resume JSON object.
    
Example of your final output format:
\`\`\`json
{{
  "analysisReport": {{ "overallScore": 95, "analysis": "[...]" }},
  "optimizedResume": {{ "info": {{}}, "sections": {{}}, "etc": "..." }}
}}
\`\`\`
`
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const resumeBuilderSystemPrompt = `You are "ResuMate", an expert and friendly career coach. Your primary goal is to collaboratively create a standout resume that highlights the user's achievements by having a natural, guided conversation.

## Your Guiding Process
You must guide the user through the following sections in this specific order to ensure a complete resume:
1.  **Goal Setting**: Ask for the user's target job or industry.
2.  **Contact Information**: Name, email, phone number.
3.  **Work Experience**: This is the most critical section.
4.  **Skills**: Technical skills, tools, and software.
5.  **Projects**: Personal, academic, or professional projects.
6.  **Education**: University, degree, and graduation date.
7.  **Final Review & Summary**: Once all sections are complete, offer to write a professional summary.

## Your Core Methodology: The STAR Method
Your most important skill is to ask probing, open-ended follow-up questions to uncover the user's accomplishments. Do not just accept surface-level descriptions.
- For every **'Work Experience'** and **'Project'** entry, your goal is to guide the user to frame their accomplishments using the STAR method.
- The STAR method helps structure stories about achievements. You should guide users to provide details for each part of their story.
- You MUST actively ask for **quantifiable Results**. For example, if a user says "I improved performance," you must follow up with "That's great! By how much did you improve performance? Was it a percentage increase in speed or a reduction in errors?"

## Interaction Style
- **One Question at a Time**: To keep the conversation natural and not overwhelming, ask only one follow-up question at a time. Do not list all the STAR questions at once.
- **No Raw Templates**: Do NOT use markdown like Situation or Result. Weave your questions into natural, encouraging sentences. Your goal is to have a conversation, not to make the user fill out a form.

## Your Conversational Loop Logic
- After successfully crafting a high-quality, achievement-oriented bullet point using the STAR method, you must first **present it back to the user** for positive reinforcement (e.g., "Excellent, we can phrase that as: 'Increased user engagement by 25% by implementing a new feedback system.'").
- Then, you must **proactively ask for confirmation to move on**. For example: "Are you happy with this description, or would you like to add another achievement for this role? Otherwise, we can move on to your next experience."
- **Always give the user the final say** on when to move to the next topic.

## Your Output Format
You must structure your ENTIRE output using the following format. Do not include any text outside of these blocks.

[RESPONSE]
Your conversational response to the user. Ask questions, confirm changes, and provide encouragement here. This part is streamed token-by-token.
[RESUME]
The complete, updated resume JSON object. This block **MUST ONLY** appear at the very end of the conversation, when all sections (Goal Setting, Contact Information, Work Experience, Skills, Projects, Education) are fully complete AND the user explicitly instructs you to "generate the resume" or similar. If these conditions are not met, **DO NOT** include this [RESUME] block in your output, even if resume data has been modified. It must be a single, raw, valid JSON object. **Do NOT escape the curly braces.**

---
### Example of a valid response:

[RESPONSE]
Great, I've added your experience as a Software Engineer at Google. To make this stand out, what was a key project you worked on and what was the measurable result of your work?
[RESUME]
{{
  "info": {{ "name": "John Doe", "email": "john.doe@example.com" }},
  "sections": {{
    "experience": [
      {{ "id": "1", "company": "Google", "position": "Software Engineer", "description": "" }}
    ]
  }},
  "sectionOrder": ["experience"]
}}
---

## Current State
You will be given the entire conversation history in chat_history, the user's latest message in input, and the current resume draft below.

Current Resume Draft:
{resume_draft}`;

/**
 * Creates a research agent that can search the web to answer questions.
 * @returns A runnable agent executor.
 */
export const createResearchAgent = ({
  apiKey,
  baseUrl,
  modelName,
  temperature,
}: CreateAgentOptions): Runnable<{ input: string; chat_history: BaseMessage[] }, Record<string, unknown>> => {
  if (!apiKey) throw new Error("API key is required for the research agent.");

  const llm = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-4-turbo",
    temperature: temperature ?? 0.2,
  });

  const searchTool = new TavilySearch({
    maxResults: 5,
  });

  const tools = [searchTool];

  const agent = createOpenAIToolsAgent({
    llm,
    tools,
    prompt: agentPrompt,
  });

  const agentExecutor = new AgentExecutor({
    // @ts-expect-error - AgentExecutor expects a slightly different type
    agent,
    tools,
    verbose: true,
  });

  return agentExecutor;
};

/**
 * Creates a powerful career agent with multiple tools.
 * @returns A runnable agent executor.
 */
export const createCareerAgent = ({
  apiKey,
  baseUrl,
  modelName,
  temperature,
}: CreateAgentOptions): AgentExecutor => {
  if (!apiKey) throw new Error("API key is required for the career agent.");

  const llm = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-4-turbo",
    temperature: temperature ?? 0.2,
    maxTokens: 65536,
  });

  const toolOptions = { apiKey, baseUrl, modelName };
  const tools = [
    new TavilySearch({ maxResults: 5 }),
    new FullResumeOptimizerTool(toolOptions),
  ];

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt: careerAgentPrompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  return agentExecutor;
};

export const createResumeExpertAgent = ({
  apiKey,
  baseUrl,
  modelName,
  temperature,
}: CreateAgentOptions): AgentExecutor => {
  if (!apiKey) throw new Error("API key is required for the resume expert agent.");

  const llm = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-4-turbo",
    temperature: temperature ?? 0.2,
    maxTokens: 8192,
  });

  const toolOptions = { apiKey, baseUrl, modelName };
  const tools = [
    new FullResumeOptimizerTool(toolOptions),
  ];

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt: resumeExpertAgentPrompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  return agentExecutor;
};

export const createResumeChatAgent = ({
  apiKey,
  baseUrl,
  modelName,
  maxTokens,
  temperature,
}: CreateAgentOptions): RunnableSequence<{ input: string; chat_history: BaseMessage[]; resume_draft: string }, AIMessage> => {
  if (!apiKey) throw new Error("API key is required for the resume chat agent.");

  const llm = getModel({
    apiKey,
    baseUrl,
    modelName: modelName ?? "gpt-4-turbo",
    temperature: temperature ?? 0.7,
    maxTokens: maxTokens ?? 4096,
    streaming: true,
  });

  const prompt = ChatPromptTemplate.fromMessages<
    { input: string; chat_history: BaseMessage[]; resume_draft: string }
  >([
    ["system", resumeBuilderSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);

  const chain: RunnableSequence<
    { input: string; chat_history: BaseMessage[]; resume_draft: string },
    AIMessage
  > = RunnableSequence.from([
    prompt,
    llm,
  ]);
  
  return chain;
} 