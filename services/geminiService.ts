import { GoogleGenAI, Type } from "@google/genai";
import { type ContentItem, isRating, type SocialAnalysis } from '../types';

// FIX: Use `process.env.API_KEY` as required by the coding guidelines.
// This also resolves the "Property 'env' does not exist on type 'ImportMeta'" error.
// The API key is assumed to be set in the execution environment.
if (!process.env.API_KEY) {
  throw new Error("Google Gemini API key is required. Make sure API_KEY is set in your environment.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "A brief analysis of why this content is good for social media. Be enthusiastic and specific."
    },
    caption: {
      type: Type.STRING,
      description: "A catchy and engaging social media caption based on the content."
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of 3-5 relevant hashtags, including #Stoutly and #Guinness."
    },
  },
  required: ['analysis', 'caption', 'hashtags'],
};

const generatePrompt = (item: ContentItem): string => {
  const commonIntro = "You are a witty and sharp social media manager for 'Stoutly', a social network for Guinness lovers. Your goal is to find user-generated content that would perform well on platforms like Instagram and X (Twitter).";
  
  if (isRating(item)) {
    return `${commonIntro}

Analyze the following Guinness rating:
- User: ${item.profiles?.username || 'An anonymous user'}
- Pub: ${item.pub_name}
- Rating: ${item.score}/10
- Review: "${item.review_text}"

Based on this, generate a social media post idea. Focus on what makes this review compelling, funny, or authentic.`;
  } else {
    return `${commonIntro}

Analyze the following user post:
- User: ${item.profiles?.username || 'An anonymous user'}
- Post: "${item.content}"

Based on this, generate a social media post idea. Look for humor, passion, or a great story.`;
  }
};


export const getSocialMediaAngle = async (item: ContentItem): Promise<SocialAnalysis | null> => {
  try {
    const prompt = generatePrompt(item);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7,
      },
    });

    const jsonString = response.text?.trim();
    if (!jsonString) {
        console.error("Gemini API returned an empty response.");
        return null;
    }
    const result = JSON.parse(jsonString);
    
    // Validate the result structure
    if (result && typeof result.analysis === 'string' && typeof result.caption === 'string' && Array.isArray(result.hashtags)) {
        return result as SocialAnalysis;
    }
    
    console.error("Parsed JSON does not match SocialAnalysis schema:", result);
    return null;

  } catch (error) {
    console.error("Error generating social media angle:", error);
    return null;
  }
};