import { config } from "../config.js";

const schema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      platform: { type: "string" },
      deadline: { type: "string" },
      genre: { type: "string" },
      gameplay: { type: "string" },
      rating: { type: "string" },
      brief: { type: "string" },
      link: { type: "string" },
    },
    required: ["name", "platform", "deadline", "genre", "gameplay", "rating", "brief", "link"],
  },
};

export async function getGeminiSummary(text, linkList) {
  const prompt = `你是一位專業遊戲編輯。請分析內容並提取「所有」限免遊戲。
當一篇文章提到多款遊戲時（如 Epic 每週限免），請務必將它們分開。

【候選網址清單】：
${linkList.join("\n")}

【配對規則】：
1. 嚴格對應：請根據遊戲在文中出現的順序，配對【候選網址清單】中對應的連結。
2. 必須回傳 JSON 陣列。
3. 每款遊戲都是獨立 JSON 物件。
4. 欄位：name、platform、deadline、genre、gameplay、rating、brief、link。
5. 內容使用繁體中文。
6. 找不到可靠對應連結時，link 請填空字串，不要猜測。

文章內容：
${text}`;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}
