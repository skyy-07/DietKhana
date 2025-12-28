
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { Ingredient, DailyPlan, UserProfile } from "../types";
import { SYSTEM_INSTRUCTION_VISION, SYSTEM_INSTRUCTION_PLANNER } from "../constants";
import { decode, decodeAudioData } from "./audioUtils";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

const cleanJson = (text: string) => {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text.trim();
};

export const analyzeFridgeImage = async (base64Image: string): Promise<Ingredient[]> => {
  const ai = getAiClient();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Identify all food items in this fridge image." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_VISION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  expiryEstimateDays: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    const data = JSON.parse(cleanJson(jsonText));
    return (data.items || []).map((item: any) => {
      let expiry = item.expiryEstimateDays;
      // Add a small random variation (+/- 1 day) to the AI's estimate for a more natural feel
      if (typeof expiry === 'number') {
        const variance = Math.floor(Math.random() * 3) - 1; // Returns -1, 0, or 1
        expiry = Math.max(1, expiry + variance); // Ensure expiry is at least 1 day
      }

      return {
        ...item,
        id: Math.random().toString(36).substring(7),
        expiryEstimateDays: expiry,
        confidence: 0.95
      };
    });
  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    throw error;
  }
};

export const generateMealPlan = async (
  inventory: Ingredient[],
  userProfile: UserProfile,
  onChunk?: (text: string) => void
): Promise<DailyPlan> => {
  const ai = getAiClient();
  
  // Enriched inventory list with expiry context for the AI
  const inventoryList = inventory.map(i => 
    `${i.name} (Expires in ${i.expiryEstimateDays} days)`
  ).join(", ");

  const userContext = `
    User Profile:
    - Name: ${userProfile.name}
    - Biometrics: ${userProfile.gender}, ${userProfile.age}y, ${userProfile.height}cm, ${userProfile.weight}kg
    
    Goals & Preferences:
    - Primary Goal: ${userProfile.primaryGoal}
    - Activity Level: ${userProfile.activityLevel}
    - Diet: ${userProfile.dietaryType}
    - Restrictions: ${userProfile.dietaryRestrictions.join(", ") || "None"}
    - Cooking Preference: ${userProfile.cookingTime}
    - Sustainability: ${userProfile.sustainabilityFocus ? "PRIORITIZE WASTE REDUCTION & ECO-FRIENDLY" : "Standard"}
    
    Targets:
    - Daily Calorie Target: ${userProfile.dailyCalorieTarget} kcal
    - Current Live Activity: Steps ${userProfile.steps}, Active Burn ${userProfile.caloriesBurned}
    
    Available Inventory:
    ${inventoryList}
  `;

  // Helper for ingredient objects
  const ingredientObjectSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      category: { type: Type.STRING, enum: ['produce', 'dairy', 'meat', 'pantry', 'beverage', 'other'] }
    },
    required: ["name", "category"]
  };

  // Schema for a single meal/recipe structure
  const mealProperties = {
    type: { type: Type.STRING },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    cuisine: { type: Type.STRING },
    ingredientsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingIngredients: { type: Type.ARRAY, items: ingredientObjectSchema },
    expiringIngredientsUsed: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ingredients used that were expiring soon" },
    wasteReductionScore: { type: Type.INTEGER, description: "0 to 100 percentage score of how much this recipe helps reduce waste" },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.INTEGER },
        protein: { type: Type.INTEGER },
        carbs: { type: Type.INTEGER },
        fats: { type: Type.INTEGER }
      },
      required: ["calories", "protein", "carbs", "fats"],
    },
    timeToCookMinutes: { type: Type.INTEGER }
  };

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `Generate a smart recipe plan. Context: ${userContext}`,
      config: {
        systemInstruction: `
          You are a sustainable fitness chef. Your goal is to generate "Smart Recipes" that:
          1. Strictly align with the user's primary goal: ${userProfile.primaryGoal}.
          2. Adhere to the ${userProfile.dietaryType} diet and avoid [${userProfile.dietaryRestrictions.join(", ")}].
          3. Respect cooking time preference: ${userProfile.cookingTime}.
          4. MINIMIZE FOOD WASTE by prioritizing ingredients listed as expiring soon (e.g. < 3 days), especially if sustainability is focused.
          
          For "missingIngredients" and "shoppingList", you MUST provide both the name and a category (produce, dairy, meat, pantry, beverage, other).
          
          For each meal slot (Breakfast, Lunch, Dinner), provide 1 Main Option and 2 Alternative Options.
          Ensure macros align with the goal (e.g. High Protein for Muscle Gain).
          
          Calculations:
          - "wasteReductionScore": Estimate 0-100 based on how many expiring items are used.
          - "expiringIngredientsUsed": List the specific items saved.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ...mealProperties,
                  alternatives: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: mealProperties.name,
                        description: mealProperties.description,
                        cuisine: mealProperties.cuisine,
                        ingredientsUsed: mealProperties.ingredientsUsed,
                        missingIngredients: mealProperties.missingIngredients,
                        expiringIngredientsUsed: mealProperties.expiringIngredientsUsed,
                        wasteReductionScore: mealProperties.wasteReductionScore,
                        nutrition: mealProperties.nutrition,
                        timeToCookMinutes: mealProperties.timeToCookMinutes
                      }
                    }
                  }
                },
                required: ["type", "name", "nutrition", "alternatives"],
              }
            },
            totalNutrition: {
              type: Type.OBJECT,
              properties: {
                 calories: { type: Type.INTEGER },
                 protein: { type: Type.INTEGER },
                 carbs: { type: Type.INTEGER },
                 fats: { type: Type.INTEGER }
              },
            },
            shoppingList: { type: Type.ARRAY, items: ingredientObjectSchema }
          }
        }
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullText += c.text;
        if (onChunk) onChunk(c.text);
      }
    }

    if (!fullText) throw new Error("No response content from Gemini.");
    return JSON.parse(cleanJson(fullText)) as DailyPlan;

  } catch (error) {
    console.error("Gemini Planner API Error:", error);
    throw error;
  }
};

export const speakHealthStatus = async (steps: number, burned: number, name: string) => {
  const ai = getAiClient();
  try {
    const prompt = `Say cheerfully: Hey ${name}! You've taken ${steps} steps and burned ${burned} calories today. You're doing great!`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
};
