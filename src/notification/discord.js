import { config } from "../config.js";
import { getSteamPriceByName } from "../platforms/steam.js";

export async function sendGameToDiscord(game, entryUrl, imageUrl) {
  const titleLink =
    typeof game.link === "string" && /^https?:\/\//i.test(game.link)
      ? game.link
      : entryUrl;

  const platform = game.platform || "未提供";
  const steamPrice =
    platform === "Steam" ? await getSteamPriceByName(game.name) : "";
  const priceDisplay = steamPrice ? `~~${steamPrice}~~ **Free**` : "**Free**";

  const payload = {
    embeds: [
      {
        title: `🎁 限時免費情報：${game.name || "未知遊戲"}`,
        url: titleLink,
        color: 3447003,
        description:
          `${priceDisplay} until \`${game.deadline || "未提供"}\`\n\n` +
          `**🎮 遊戲類型：** ${game.genre || "未提供"}\n` +
          `**🕹️ 玩法簡介：** ${game.gameplay || "未提供"}\n` +
          `**⭐️ 玩家評價：** ${game.rating || "未提供"}\n` +
          `> ${game.brief || ""}`,
        fields: [
          { name: "領取平台", value: platform, inline: true },
          { name: "文章來源", value: `[4Gamers 傳送門](${entryUrl})`, inline: true },
        ],
        ...(imageUrl ? { image: { url: imageUrl } } : {}),
        footer: { text: "限時免費情報系統" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(config.discordWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${await response.text()}`);
  }

  console.log(`Sent: ${game.name}`);
}
