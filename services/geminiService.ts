import { GoogleGenAI, Type } from "@google/genai";
import { BankId, RawCategory } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert AI OCR assistant for Russian banking apps. Your task is to analyze screenshots and extract cashback categories.

**Input:** A batch of images containing cashback selection screens from Sber, VTB, T-Bank (Tinkoff), Alfa, or Yandex.
**Output:** A single JSON array containing ALL extracted categories from ALL images.

**CRITICAL INSTRUCTION:**
- Analyze EVERY image provided. Do not stop after the first few.
- If an image contains a list or grid of categories, extract ALL of them.
- If you see a scrolling list across multiple images, treat them as part of the same selection process.

**Bank Identification Rules:**
1. **Alfa Bank:** White background, "Сервисы Альфа-Банка", square checkboxes, red accents.
2. **VTB:** Dark or Light background, Blue icons/checks, title "Выбор категорий...".
3. **T-Bank (Tinkoff):** Dark background, Yellow buttons, Circular checks. Format often "5% Taxi".
4. **Sber:** Green gradients/accents, "Выберите 5 категорий".
5. **Yandex:** 
   - Distinctive "cards" or "tiles" layout on gray/white background.
   - Branding: "Yandex Pay", "Пэй", "Баллы", "Выгода".
   - Categories often appear as rectangular cards with an icon and percentage.
   - NOTE: Yandex screenshots might not always have a header. Look for the card style.

**Selectability Rule:**
Extract ONLY categories that are selectable for the current month.
- **Valid:** Categories with empty checkboxes/radio buttons/toggles.
- **Valid:** Categories in a grid that look like selectable options (tiles).
- **Valid:** For Yandex, cards that represent a category choice.
- **Ignore:** Items with lock icons 🔒.
- **Ignore:** "Up to" (до 10%) *promotional banners*. However, if a category tile says "до 10%" but is clearly a selection option for the month, INCLUDE it (extract the max percentage).
- **Ignore:** Already activated categories IF they cannot be changed (but usually for planning we want to see them).

**Extraction Format:**
For each valid category, return:
- bankName: "sber", "vtb", "tbank", "alfa", "yandex".
- categoryName: The cleaner name (e.g., "Taxi", not "5% Taxi").
- percentage: The integer number (e.g., 5).
`;

export const analyzeImages = async (
  files: File[]
): Promise<RawCategory[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  // Convert files to base64
  const parts = await Promise.all(
    files.map(async (file) => {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data url prefix
            const base64Data = result.split(',')[1];
            resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });

      return {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      };
    })
  );

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            bankName: { type: Type.STRING, enum: ["sber", "vtb", "tbank", "alfa", "yandex"] },
            categoryName: { type: Type.STRING },
            percentage: { type: Type.NUMBER },
          },
          required: ["bankName", "categoryName", "percentage"],
        },
      },
    },
    contents: {
        role: "user",
        parts: [
            { text: `Process these ${files.length} screenshot(s). Extract all cashback categories from every single image.` },
            ...parts
        ]
    }
  });

  const rawData = JSON.parse(response.text || "[]");

  return rawData.map((item: any, index: number) => ({
    id: `${item.bankName}-${index}-${Date.now()}-${Math.random()}`,
    bankId: (item.bankName as BankId),
    rawName: item.categoryName,
    percentage: item.percentage,
  }));
};
