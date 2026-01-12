import { GoogleGenAI, Type } from "@google/genai";
import { type ContentItem, isRating, type SocialAnalysis, type Rating, type PintOfTheWeekAnalysis } from '../types';

// FIX: Per @google/genai guidelines, API key must be from process.env.API_KEY
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
    winnerIndex: {
      type: Type.INTEGER,
      description: "The zero-based index of the winning rating from the array provided in the prompt.",
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
  required: ['winnerIndex', 'analysis', 'socialScore'],
};

export const findPintOfTheWeek = async (ratings: Rating[]): Promise<{ success: true; data: PintOfTheWeekAnalysis } | { success: false; error: string }> => {
  try {
    // We only need to send the relevant data for analysis, not the full object.
    const ratingsForPrompt = ratings.map(r => ({
      // The ID is still useful context for the AI, even if it doesn't return it.
      id: r.id, 
      username: r.profiles?.username,
      pub_name: r.pubs?.name,
      quality: r.quality,
      message: r.message,
      like_count: r.like_count,
      comment_count: r.comment_count,
      has_image: !!r.image_url,
    }));

    const prompt = `You are a savvy social media expert for 'Stoutly', a Guinness lovers' social network. Your task is to select the "Pint of the Week".

I will provide you with a JSON array of objects. Each object represents a single Guinness rating.

Analyze all of them based on the following criteria:
1.  **Photo Quality**: The 'has_image' field being true is essential. The visual appeal is the most important factor.
2.  **Review Authenticity & Vibe**: Does the 'message' sound genuine, witty, or heartfelt? Does the combination of the photo, review, and 'quality' rating create a compelling story?
3.  **Rating & Engagement**: High 'quality' scores and strong 'like_count'/'comment_count' are a good indicator.

From the JSON array below, choose the ONE pint that has the most potential to go viral and represent our brand this week.

Here are the candidates:
${JSON.stringify(ratingsForPrompt, null, 2)}

Your task is to respond with a JSON object. The 'winnerIndex' field in your response is the most critical part. It MUST be the zero-based index of the rating you chose from the array I provided. For example, if you choose the first rating in the array, return 0. If you choose the third, return 2.`;

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
        const errorMessage = "AI returned an empty or invalid response. This might be a temporary issue with the service.";
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    let result;
    try {
        result = JSON.parse(jsonString);
    } catch (parseError) {
        const errorMessage = "AI returned a response that was not valid JSON. This is an API-side issue.";
        console.error(errorMessage, { response: jsonString });
        return { success: false, error: errorMessage };
    }

    if (result && typeof result.winnerIndex === 'number' && typeof result.analysis === 'string' && typeof result.socialScore === 'number') {
      const winnerIndex = result.winnerIndex;

      // VALIDATION STEP: Ensure the returned index is within the bounds of the original array.
      if (winnerIndex < 0 || winnerIndex >= ratings.length) {
        const errorMessage = `AI returned an invalid index. It returned '${winnerIndex}', which is outside the bounds of the provided list (0-${ratings.length - 1}).`;
        console.error(errorMessage, {
          returnedIndex: winnerIndex,
          listSize: ratings.length,
        });
        return { success: false, error: errorMessage };
      }
      
      const winningRating = ratings[winnerIndex];
      
      // Construct the final analysis object with the correct ID.
      const finalAnalysis: PintOfTheWeekAnalysis = {
        id: winningRating.id,
        analysis: result.analysis,
        socialScore: result.socialScore,
      };

      return { success: true, data: finalAnalysis };
    }
    
    const schemaErrorMessage = "AI's response did not match the expected format. It returned a valid JSON object, but the structure was incorrect.";
    console.error(schemaErrorMessage, { response: result });
    return { success: false, error: schemaErrorMessage };
    
  } catch (error: any) {
    const apiErrorMessage = `An API error occurred while trying to find the Pint of the Week: ${error.message || 'Unknown error'}`;
    console.error(apiErrorMessage, error);
    return { success: false, error: apiErrorMessage };
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