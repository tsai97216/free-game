export const PLATFORM_DEFINITIONS = {
  Steam: {
    urls: [/^https:\/\/store\.steampowered\.com\//i],
  },
  GOG: {
    urls: [/^https:\/\/www\.gog\.com\/(?:en\/)?game\//i],
  },
  DLsite: {
    urls: [/^https:\/\/www\.dlsite\.com\//i],
  },
  "Epic Games": {
    urls: [/^https:\/\/store\.epicgames\.com\//i],
  },
  "Ubisoft Connect": {
    urls: [/^https:\/\/store\.ubisoft\.com\//i],
  },
};

export const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_DEFINITIONS);

export function isSupportedPlatform(platform) {
  return SUPPORTED_PLATFORMS.includes(platform);
}

export function normalizePlatform(platform) {
  const value = String(platform || "").trim().toLowerCase();

  const aliases = {
    steam: "Steam",
    gog: "GOG",
    "gog.com": "GOG",
    dlsite: "DLsite",
    "dlsite.com": "DLsite",
    epic: "Epic Games",
    "epic games": "Epic Games",
    ubisoft: "Ubisoft Connect",
    "ubisoft connect": "Ubisoft Connect",
  };

  return aliases[value] || String(platform || "").trim();
}

export function isSupportedStoreUrl(url) {
  if (!url) return false;
  return Object.values(PLATFORM_DEFINITIONS).some(({ urls }) =>
    urls.some((pattern) => pattern.test(url))
  );
}
