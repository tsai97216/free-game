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
  const prompt = `你是一位專業遊戲編輯。請分析內容並提取所有可以永久加入玩家帳號的 DLsite 限免商品。

目前這個 worker 只支援 DLsite。
請不要回傳 Steam、GOG、Epic Games、Ubisoft Connect、Nintendo Switch 或其他平台。

【最重要的判斷】
只有「現在免費，且完成取得後可以永久加入玩家帳號」才算符合。
以下全部排除：
- 限時免費遊玩、Free Play、免費週末
- Demo、試玩版、Trial
- 免費體驗、限時體驗
- 只在活動期間免費遊玩的內容
- 需要訂閱服務才能遊玩的免費活動
- 任何無法確認可以永久加入帳號的內容

請為每款候選商品填寫 availability：
- 「永久加入」：文章明確表示可永久加入／免費保留，或有充分資訊可以確認完成取得後永久擁有。
- 「暫時遊玩」：明確屬於 Free Play、免費週末、試玩、Demo、Trial 或其他暫時遊玩活動。
- 「不確定」：文章資訊不足，無法確認是否可以永久加入。

只有 availability = 「永久加入」的商品才能出現在最終 JSON 陣列中。若無符合項目，回傳空陣列。

【候選網址清單】：
${linkList.join("\n")}

【配對規則】：
1. 只回傳 DLsite 商品。
2. 嚴格對應文章內容與【候選網址清單】，不要猜測網址。
3. 必須回傳 JSON 陣列。
4. 每款商品都是獨立 JSON 物件。
5. 欄位：name、platform、availability、deadline、genre、gameplay、rating、brief、link。
6. platform 固定填「DLsite」。
7. 內容使用繁體中文。
8. 找不到可靠 DLsite 商品連結時，link 請填空字串。
9. 不要因為文章標題含有「限免」就直接判定為永久加入，必須看文章正文的實際描述。

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
