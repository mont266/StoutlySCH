import { GoogleGenAI, Type } from "@google/genai";
import { type ContentItem, isRating, type SocialAnalysis, type Rating, type PintOfTheWeekAnalysis } from '../types';

// The API key is injected from environment variables provided by Vite.
// Ensure VITE_API_KEY is set in your environment.
const geminiApiKey = (import.meta as any).env.VITE_API_KEY;

if (!geminiApiKey) {
  throw new Error("Gemini API key is required. Make sure VITE_API_KEY is set in your environment.");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

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
  
  const statsInfo = `\n- Likes: ${item.like_count}\n- Comments: ${item.comment_count}`;

  if (isRating(item)) {
    const imageInfo = item.image_url ? "\n- Note: This rating includes a photo of the pint, making it great for visual platforms." : "";
    // Assuming price is a rating out of 5 for value.
    const priceInfo = item.price ? `\n- Value Rating: ${item.price}/5` : "";

    return `${commonIntro}

Analyze the following Guinness rating:
- User: ${item.profiles?.username || 'An anonymous user'}
- Pub: ${item.pubs?.name || 'Unknown Pub'}
- Quality Rating: ${item.quality}/5${priceInfo}
- Review: "${item.message}"${statsInfo}${imageInfo}

Based on this, generate a social media post idea. Focus on what makes this review compelling, funny, or authentic. Consider the engagement numbers, ratings, and the presence of a photo.`;
  } else {
    return `${commonIntro}

Analyze the following user post:
- User: ${item.profiles?.username || 'An anonymous user'}
- Post: "${item.content}"${statsInfo}

Based on this, generate a social media post idea. Look for humor, passion, or a great story. Consider the engagement numbers.`;
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


// New functions for Pint of the Week

const pintOfTheWeekSchema = {
  type: Type.OBJECT,
  properties: {
    id: {
      type: Type.STRING,
      description: "The unique ID of the rating you have chosen as the Pint of the Week.",
    },
    analysis: {
      type: Type.STRING,
      description: "A detailed analysis explaining why you chose this specific pint. Mention the photo quality, review authenticity, and overall social media potential."
    },
    socialScore: {
      type: Type.NUMBER,
      description: "A score from 0-100 representing its potential for social media engagement."
    },
  },
  required: ['id', 'analysis', 'socialScore'],
};

export const findPintOfTheWeek = async (ratings: Rating[]): Promise<PintOfTheWeekAnalysis | null> => {
  try {
    // Use a dictionary/map with the ID as the key to make the AI's task more constrained
    const ratingsForPrompt = ratings.reduce((acc, r) => {
      acc[r.id] = {
        username: r.profiles?.username,
        pub_name: r.pubs?.name,
        quality: r.quality,
        message: r.message,
        like_count: r.like_count,
        comment_count: r.comment_count,
        has_image: !!r.image_url,
      };
      return acc;
    }, {} as Record<string, any>);

    const prompt = `You are a savvy social media expert for 'Stoutly', a Guinness lovers' social network. Your task is to select the "Pint of the Week".

I will provide you with a JSON object where each key is a unique rating ID, and the value is an object containing the rating details. The rating details object has the following keys: 'username', 'pub_name', 'quality', 'message', 'like_count', 'comment_count', 'has_image'.

Analyze all of them based on the following criteria:
1.  **Photo Quality**: The 'has_image' field being true is essential. The visual appeal is the most important factor.
2.  **Review Authenticity & Vibe**: Does the 'message' sound genuine, witty, or heartfelt? Does the combination of the photo, review, and 'quality' rating create a compelling story?
3.  **Rating & Engagement**: High 'quality' scores and strong 'like_count'/'comment_count' are a good indicator.

From the JSON object below, choose the ONE pint that has the most potential to go viral and represent our brand this week.

Here are the candidates:
${JSON.stringify(ratingsForPrompt, null, 2)}

Respond with your choice in the specified JSON format. The 'id' in your response MUST be one of the keys from the JSON object I provided.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pintOfTheWeekSchema,
      },
    });
    
    const jsonString = response.text?.trim();
    if (!jsonString) {
        console.error("Gemini API returned an empty response for Pint of the Week analysis.");
        return null;
    }
    const result = JSON.parse(jsonString);

    if (result && typeof result.id === 'string' && typeof result.analysis === 'string' && typeof result.socialScore === 'number') {
      return result as PintOfTheWeekAnalysis;
    }
    
    console.error("Parsed JSON does not match PintOfTheWeekAnalysis schema:", result);
    return null;
    
  } catch (error) {
    console.error("Error finding Pint of the Week:", error);
    return null;
  }
};

const urlToBase64 = async (url: string): Promise<{ mimeType: string; data: string } | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const [meta, base64Data] = result.split(',');
        const mimeType = meta.split(';')[0].split(':')[1];
        resolve({ mimeType, data: base64Data });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to Base64:", error);
    return null;
  }
};


export const createSharableImage = async (rating: Rating): Promise<string | null> => {
  if (!rating.image_url) return null;

  const imageData = await urlToBase64(rating.image_url);
  if (!imageData) {
    console.error("Failed to convert image URL to base64.");
    return null;
  }

  const prompt = `You are a creative graphic designer for the 'Stoutly' social network.
Take the provided image of a pint of Guinness and transform it into a vibrant, shareable social media graphic for our "Pint of the Week" feature.

Your design MUST include:
1. The original pint image as the main centerpiece.
2. The text "Pint of the Week" in a stylish, bold, eye-catching font.
3. The pub's name: "${rating.pubs?.name || 'A Fine Establishment'}"
4. The user's username: "@${rating.profiles?.username || 'A Stout Lover'}"
5. The "Stoutly" brand name or a stylized version of the name.

The overall aesthetic should be modern, engaging, and premium, with a dark theme complemented by gold or cream accents, echoing the iconic Guinness colors. Ensure the final image is a standard square social media post format (1:1 aspect ratio).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data,
            },
          },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    console.error("No image part found in Gemini response.");
    return null;

  } catch (error) {
    console.error("Error creating sharable image:", error);
    return null;
  }
};