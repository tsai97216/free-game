// ==================== 核心設定區 ====================
const RSS_URL = 'https://www.4gamers.com.tw/rss/latest-news';

// 建議從 PropertiesService 讀取敏感資訊，避免金鑰外洩
const WEBHOOK_URL =
  PropertiesService.getScriptProperties().getProperty('WEBHOOK_URL') ||
  'YOUR_DISCORD_WEBHOOK_URL';

const GEMINI_API_KEY =
  PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') ||
  'YOUR_GEMINI_API_KEY';

const KEYWORD = /限免|限時免費|紳士限免/;

// ==================== 核心工具函數 ====================

function isProcessed(link) {
  const props = PropertiesService.getScriptProperties();
  const seenJson = props.getProperty('PROCESSED_LINKS') || '[]';
  const seenLinks = JSON.parse(seenJson);
  return seenLinks.includes(link);
}

function markAsProcessed(link) {
  const props = PropertiesService.getScriptProperties();
  let seenLinks = JSON.parse(
    props.getProperty('PROCESSED_LINKS') || '[]'
  );

  seenLinks.push(link);

  if (seenLinks.length > 30) {
    seenLinks.shift();
  }

  props.setProperty('PROCESSED_LINKS', JSON.stringify(seenLinks));
}

/**
 * 強化版：從 HTML 中提取所有商店連結（支援 Epic 多樣化路徑）
 */
function extractAllLinks(html) {
  const links = new Set();

  // 針對 Steam、Epic、DLsite 的網址進行寬鬆且精準的捕捉
  const regex =
    /(?:href|src)="(https:\/\/store\.steampowered\.com\/(?:app|widget)\/(\d+)[^"'\s]*|https:\/\/store\.epicgames\.com\/[^"'\s]+|https:\/\/(?:www\.)?dlsite\.com\/[^"'\s]+)"/gi;

  let match;

  while ((match = regex.exec(html)) !== null) {
    let rawLink = match[1];

    // 處理 Steam Widget
    if (rawLink.includes('steampowered.com/widget/')) {
      const appId = match[2];
      rawLink = `https://store.steampowered.com/app/${appId}/`;
    }

    links.add(rawLink);
  }

  return Array.from(links);
}

function getSteamPriceByName(gameName) {
  if (!gameName || gameName === '未知遊戲') {
    return '';
  }

  try {
    const searchUrl =
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
        gameName
      )}&l=taiwan&cc=TW`;

    const response = UrlFetchApp.fetch(searchUrl, {
      muteHttpExceptions: true,
    });

    const data = JSON.parse(response.getContentText());

    if (data.total > 0 && data.items[0].price) {
      return `NT$ ${data.items[0].price.initial / 100}`;
    }
  } catch (e) {
    console.log('Steam API 異常');
  }

  return '';
}

// ==================== 主程式區 ====================

function checkUpdateWithImage() {
  try {
    const response = UrlFetchApp.fetch(RSS_URL, {
      muteHttpExceptions: true,
    });

    let xmlText = response.getContentText();
    xmlText = xmlText.replace(
      /&(?!amp;|lt;|gt;|quot;|apos;)/g,
      '&amp;'
    );

    const document = XmlService.parse(xmlText);
    const channel = document.getRootElement().getChild('channel');
    const items = channel.getChildren('item');

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const entryUrl = item.getChildText('link') || '';
      const title = item.getChildText('title') || '';

      if (KEYWORD.test(title) && !isProcessed(entryUrl)) {
        sendToDiscordWithAI(item);
        markAsProcessed(entryUrl);
      }
    }
  } catch (e) {
    console.log('系統運行失敗：' + e.toString());
  }
}

function sendToDiscordWithAI(item) {
  const entryUrl = item.getChildText('link');
  const pageResponse = UrlFetchApp.fetch(entryUrl);
  const html = pageResponse.getContentText();

  const imgMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  const imageUrl = imgMatch ? imgMatch[1] : '';

  // 1. 提取連結清單
  const allStoreLinks = extractAllLinks(html);

  // 2. 處理文字內容（保留較多內容給 AI 以便辨識順序）
  let plainText = html.split('</head>')[1] || html;
  plainText = plainText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. AI 配對
  const aiDataList = getGeminiSummary(
    plainText.substring(0, 3800),
    allStoreLinks
  );

  if (!Array.isArray(aiDataList)) {
    return;
  }

  aiDataList.forEach((game) => {
    // 連結保護機制
    const titleLink =
      game.link &&
      game.link !== 'null' &&
      game.link.startsWith('http')
        ? game.link
        : entryUrl;

    const platformStr = game.platform || 'Epic Games';
    const steamPrice = getSteamPriceByName(game.name);
    const priceDisplay = steamPrice
      ? `~~${steamPrice}~~ **Free**`
      : '**Free**';

    const payload = {
      embeds: [
        {
          title: `🎁 限時免費情報：${game.name || '未知遊戲'}`,
          url: titleLink,
          color: 3447003,
          description: `${priceDisplay} until ${game.deadline}

🎮 **遊戲類型**：${game.genre}
🕹️ **玩法簡介**：${game.gameplay}
⭐ **玩家評價**：${game.rating}
> ${game.brief}`,
          fields: [
            {
              name: '領取平台',
              value: platformStr,
              inline: true,
            },
            {
              name: '文章來源',
              value: `[4Gamers 傳送門](${entryUrl})`,
              inline: true,
            },
          ],
          image: {
            url: imageUrl,
          },
          footer: {
            text: '限時免費情報系統',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
    });

    // 若有多款遊戲，稍微延遲 1 秒，避免 Discord 順序錯亂
    Utilities.sleep(1000);
  });
}

function getGeminiSummary(text, linkList) {
  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `你是一位專業遊戲編輯，請分析內容並提取「所有」限免遊戲。
當一篇文章提到多款遊戲時（如 Epic 每週限免），請務必將它們分開。

【候選網址清單】：
${linkList.join('\n')}

【配對規則】：
1. 嚴格對應：請根據遊戲在文中出現的順序，配對【候選網址清單】中對應的連結。
2. 輸出格式：必須回傳一個 JSON 陣列。
3. 欄位要求：{ "name": "名稱", "platform": "平台", "deadline": "期限", "genre": "類型", "gameplay": "玩法特色", "rating": "口碑", "brief": "一句推薦", "link": "挑選的連結" }
4. 即使兩款遊戲在同一篇文章，也請回傳兩個獨立的 JSON 物件。
5. 內容使用繁體中文。

文章內容：
`;

  try {
    const res = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt + text,
              },
            ],
          },
        ],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
        ],
      }),
    });

    const json = JSON.parse(res.getContentText());

    if (json.candidates && json.candidates[0]?.content) {
      let raw = json.candidates[0].content.parts[0].text;

      // 清除 markdown 代碼塊標記
      raw = raw.replace(/\`\`\`json\s*|\`\`\`/g, '').trim();

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    console.log('AI 解析失敗：' + e.toString());
  }

  return [
    {
      name: '解析失敗',
      platform: '未知',
      deadline: '未提供',
      link: null,
    },
  ];
}
