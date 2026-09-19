import { config } from "../config.js";

const schema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      platform: { type: "string" },
      availability: {
        type: "string",
        enum: ["永久加入", "暫時遊玩", "不確定"],
      },
      deadline: { type: "string" },
      genre: { type: "string" },
      gameplay: { type: "string" },
      rating: { type: "string" },
      brief: { type: "string" },
      link: { type: "string" },
    },
    required: [
      "name",
      "platform",
      "availability",
      "deadline",
      "genre",
      "gameplay",
      "rating",
      "brief",
      "link",
    ],
  },
};

export async function getGeminiSummary(text, linkList) {
  const prompt = `你是一位專業遊戲編輯。請分析內容並提取「所有」可以永久加入玩家帳號的限免遊戲。

目前支援的平台只有：Steam、GOG、DLsite、Epic Games、Ubisoft Connect。
請不要回傳 Nintendo Switch 或其他平台。

【最重要的判斷】
只有「現在免費，且完成領取後可以永久加入玩家帳號」才算符合。
以下全部排除：
- 限時免費遊玩、Free Play、免費週末
- Demo、試玩版、Trial
- 免費體驗、限時體驗
- 只在活動期間免費遊玩的完整遊戲
- 需要訂閱服務才能遊玩的免費活動
- 任何無法確認可以永久加入帳號的內容

請為每款候選遊戲填寫 availability：
- 「永久加入」：文章明確表示可永久加入／免費保留／Free to Keep，或有充分資訊可以確認完成領取後永久擁有。
- 「暫時遊玩」：明確屬於 Free Play、免費週末、試玩、Demo、Trial 或其他暫時遊玩活動。
- 「不確定」：文章資訊不足，無法確認是否可以永久加入。

只有 availability = 「永久加入」的遊戲才能出現在最終 JSON 陣列中。若無符合項目，回傳空陣列。

當一篇文章提到多款遊戲時（如 Epic 每週限免），請務必將它們分開判斷。

【候選網址清單】：
${linkList.join("\n")}

【配對規則】：
1. 嚴格對應：請根據遊戲在文中出現的順序，配對【候選網址清單】中對應的連結。
2. 必須回傳 JSON 陣列。
3. 每款遊戲都是獨立 JSON 物件。
4. 欄位：name、platform、availability、deadline、genre、gameplay、rating、brief、link。
5. 內容使用繁體中文。
6. 找不到可靠對應連結時，link 請填空字串，不要猜測。
7. platform 請填實際領取平台，不要自行創造平台名稱。
8. 不要因為文章標題含有「限免」就直接判定為永久加入，必須看文章正文的實際描述。

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
