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

export const generateWeeklySummary = async (data: { topUsers: any[], newUsersCount: number, newPosts: any[] }): Promise<string | null> => {
  try {
    const prompt = `You are a witty and sharp social media manager for 'Stoutly', a social network for Guinness lovers. 
    Your goal is to generate a brief, engaging summary for our weekly leaderboard graphic.

    Here's the data for the past 7 days:
    - Top 5 Most Active Users: ${JSON.stringify(data.topUsers.map(u => u.username))}
    - New Members Joined: ${data.newUsersCount}
    - A few posts from newcomers: ${JSON.stringify(data.newPosts.map(p => p.content))}

    Based on this, write a short, celebratory summary (2-3 sentences). Be enthusiastic and welcoming. For example: "What a week! Huge congrats to our top contributors like ${data.topUsers[0]?.username} for leading the charge. We also welcomed ${data.newUsersCount} new faces to the Stoutly family. Cheers to another great week!"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
      },
    });

    return response.text?.trim() || null;

  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return null;
  }
};

export const findPintOfTheWeek = async (ratings: Rating[], excludedIds: string[] = []): Promise<{ success: true; data: PintOfTheWeekAnalysis } | { success: false; error: string }> => {
  try {
    // Filter out excluded IDs
    const filteredRatings = ratings.filter(r => !excludedIds.includes(r.id));

    if (filteredRatings.length === 0) {
      return { success: false, error: "No more ratings available to analyze after exclusions." };
    }

    // We only need to send the relevant data for analysis, not the full object.
    const ratingsForPrompt = filteredRatings.map(r => ({
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
      if (winnerIndex < 0 || winnerIndex >= filteredRatings.length) {
        const errorMessage = `AI returned an invalid index. It returned '${winnerIndex}', which is outside the bounds of the provided list (0-${filteredRatings.length - 1}).`;
        console.error(errorMessage, {
          returnedIndex: winnerIndex,
          listSize: filteredRatings.length,
        });
        return { success: false, error: errorMessage };
      }
      
      const winningRating = filteredRatings[winnerIndex];
      
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

const pubSpotlightSchema = {
  type: Type.OBJECT,
  properties: {
    vibeAnalysis: {
      type: Type.STRING,
      description: "A 2-sentence summary of the pub's vibe based on user reviews. E.g., 'Locals love the cozy fire...'"
    },
    socialCaption: {
      type: Type.STRING,
      description: "An engaging Instagram/Facebook caption announcing this pub as the Spotlight Winner."
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Relevant hashtags."
    }
  },
  required: ['vibeAnalysis', 'socialCaption', 'hashtags']
};

export const analyzePubSpotlight = async (pubName: string, location: string, ratings: Rating[]): Promise<{ vibeAnalysis: string, socialCaption: string, hashtags: string[] } | null> => {
  try {
    const reviews = ratings.map(r => `"${r.message}" (${r.quality}/5)`).join("\n");
    
    const prompt = `You are the social media manager for Stoutly. We are featuring "${pubName}" in ${location} as our "Pub Spotlight".
    
    Here are recent reviews from our users:
    ${reviews}
    
    Task:
    1. Write a "Vibe Check" (2 sentences max) summarizing what people love about this place.
    2. Write a catchy social media caption for Instagram/Facebook highlighting this pub.
       - TONE: Community-focused, appreciative, "hidden gem" or "local favorite".
       - AVOID: "Winner", "Champion", "Best Pub", "Competition".
       - FOCUS: "Spotlight", "Highlight", "Check this out", "Stoutly Community Pick".
       - CRITICAL: Base the caption ONLY on the provided reviews. Do not invent features (e.g., "great food", "live music") unless explicitly mentioned in the reviews.
       - MANDATORY: End the caption with this exact disclaimer: "Disclaimer: This spotlight is selected based on Stoutly user ratings and criteria. It is not sponsored or paid for by the pub."
    3. Generate 3-5 relevant hashtags.
    
    Return JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pubSpotlightSchema,
        temperature: 0.7,
      },
    });

    const jsonString = response.text?.trim();
    if (!jsonString) return null;
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error analyzing pub spotlight:", error);
    return null;
  }
};