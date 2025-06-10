export const jdAnalysisPrompt = `You are an expert HR analyst. Analyze the following job description and extract the key information.

Job Description:
{jd}

{format_instructions}

Return ONLY the JSON object, without any markdown formatting or extra text.

JSON Output:`; 