export const PLATFORM_DEFINITIONS = {
  DLsite: {
    urls: [/^https:\/\/www\.dlsite\.com\//i],
  },
};

export const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_DEFINITIONS);

export function isSupportedPlatform(platform) {
  return SUPPORTED_PLATFORMS.includes(platform);
}

export function normalizePlatform(platform) {
  const value = String(platform || "").trim().toLowerCase();

  const aliases = {
    dlsite: "DLsite",
    "dlsite.com": "DLsite",
  };

  return aliases[value] || String(platform || "").trim();
}

export function isSupportedStoreUrl(url) {
  if (!url) return false;
  return Object.values(PLATFORM_DEFINITIONS).some(({ urls }) =>
    urls.some((pattern) => pattern.test(url))
  );
}
