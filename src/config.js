const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const config = {
  rssUrl: process.env.RSS_URL || "https://www.4gamers.com.tw/rss/latest-news",
  discordWebhookUrl: required("DISCORD_WEBHOOK_URL"),
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  processedLimit: Number(process.env.PROCESSED_LIMIT || 30),
  dlsiteStorageState: process.env.DLSITE_STORAGE_STATE || "auth/dlsite.json",
  autoClaim: process.env.AUTO_CLAIM === "true",
  claimDryRun: process.env.CLAIM_DRY_RUN === "true",
};
