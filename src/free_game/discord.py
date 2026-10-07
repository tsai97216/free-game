from datetime import datetime, timezone

from .models import Game


def clip(value, n):
    value = value.strip()
    return value if len(value) <= n else value[: n - 1] + "…"


def optional_field(name, value, inline=True):
    value = str(value or "").strip()
    if not value:
        return None
    return {"name": name, "value": clip(value, 1024), "inline": inline}


class DiscordSender:
    def __init__(self, http, webhook):
        self.http, self.webhook = http, webhook

    def send(self, game, article_title, article_url):
        if game.steam_price:
            price = f"~~{game.steam_price}~~ → **免費**"
        else:
            price = "**免費**"

        deadline = game.deadline or "期限未提供"
        brief = game.brief or "限時免費活動"
        description = (
            f"**限時免費** · {clip(deadline, 200)}\n"
            f"{price}\n\n"
            f"{clip(brief, 1000)}"
        )

        fields = [
            {
                "name": "⏳ 免費期限",
                "value": clip(deadline, 1024),
                "inline": True,
            },
            {
                "name": "🎮 平台",
                "value": clip(game.platform or "未知", 1024),
                "inline": True,
            },
        ]

        for field in (
            optional_field("🧩 遊戲類型", game.genre),
            optional_field("⭐ 玩家評價", game.rating),
            optional_field("🕹️ 玩法", game.gameplay, inline=False),
            optional_field(
                "📰 文章來源",
                f"[4Gamers 傳送門]({article_url})",
            ),
            optional_field(
                "🛒 立即領取",
                f"[開啟商店頁面]({game.link})",
            ),
        ):
            if field:
                fields.append(field)

        embed = {
            "title": clip(f"🎁 {game.name}", 256),
            "url": game.link,
            "description": clip(description, 4096),
            "color": 0x5865F2,
            "fields": fields,
            "footer": {"text": "Free Game Notifier"},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if game.image:
            embed["image"] = {"url": game.image}

        payload = {
            "allowed_mentions": {"parse": []},
            "embeds": [embed],
        }
        self.http.post_json(self.webhook, payload)
