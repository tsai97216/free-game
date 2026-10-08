from datetime import datetime, timezone
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .models import Game


def clip(value, n):
    value = str(value or "").strip()
    return value if len(value) <= n else value[: n - 1] + "…"


def enable_components(url):
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["with_components"] = "true"
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )


class DiscordSender:
    def __init__(self, http, webhook):
        self.http, self.webhook = http, webhook

    def send(self, game, article_title, article_url):
        original_price = game.steam_price or "免費"
        deadline = game.deadline or "期限未提供"
        platform = game.platform or "未知"
        genre = game.genre or "未知"
        brief = game.brief or "限時免費活動"
        rating = game.rating or "None"

        description = (
            f"💰 **原價**　{clip(original_price, 200)}\n"
            f"⏳ **期限**　{clip(deadline, 200)}\n"
            f"🎮 **平台**　{clip(platform, 200)}\n"
            f"🧩 **遊戲類型**　{clip(genre, 200)}\n"
            f"📝 **介紹**　{clip(brief, 80)}\n"
            f"⭐ **玩家評價**　{clip(rating, 300)}"
        )

        embed = {
            "title": clip(game.name, 256),
            "url": game.link,
            "description": clip(description, 4096),
            "color": 0x5865F2,
            "footer": {"text": "Free Game Notifier"},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if game.image:
            embed["image"] = {"url": game.image}

        payload = {
            "allowed_mentions": {"parse": []},
            "embeds": [embed],
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": 5,
                            "label": "4Gamers",
                            "emoji": {"name": "🔗"},
                            "url": article_url,
                        },
                        {
                            "type": 2,
                            "style": 5,
                            "label": "商店頁",
                            "emoji": {"name": "🛒"},
                            "url": game.link,
                        },
                    ],
                }
            ],
        }

        self.http.post_json(enable_components(self.webhook), payload)
