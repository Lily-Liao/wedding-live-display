
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FALLBACK_WISHES = [
  "祝玗與生歲月靜好，共度餘生，幸福美滿。❤️",
  "願時光溫柔，許你們一世安穩，新婚快樂！✨",
  "玗生相伴，歲月如歌。祝福這對天作之合。🌹",
  "白頭偕老，永浴愛河，玗與生的幸福故事才剛開始。🥂",
  "看見幸福的模樣，就是你們站在一起的樣子。💖",
  "願玗與生的每一天，都像今日這般燦爛奪目。🏮",
  "執子之手，與子偕老，歲月敬好，與你共度。🕊️",
  "最美的承諾，是和你一起慢慢變老。恭喜新人！💌"
];

export const generateRomanticWish = async (guestName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `身為一位優雅的婚禮賓客，請幫 ${guestName} 寫一段給新人「玗」和「生」的祝福語。
      要求：
      1. 風格浪漫、詩意且充滿手寫溫度的感覺。
      2. 繁體中文。
      3. 內容包含對「歲月敬好」或「共度玗生」的呼應。
      4. 長度約 20 字以內。
      5. 結尾加上一個合適的 Emoji。
      只要回覆祝福語內容即可，不要有其他廢話。`,
    });
    
    return response.text?.trim() || FALLBACK_WISHES[Math.floor(Math.random() * FALLBACK_WISHES.length)];
  } catch (error: any) {
    // Silently handle quota errors and return a beautiful local fallback
    if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
      console.warn("Gemini API Rate Limit hit, using local fallback.");
    } else {
      console.error("Gemini Error:", error);
    }
    return FALLBACK_WISHES[Math.floor(Math.random() * FALLBACK_WISHES.length)];
  }
};
