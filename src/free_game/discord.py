from datetime import datetime, timezone

from .models import Game


def clip(value, n):
    value = value.strip()
    return value if len(value) <= n else value[: n - 1] + "…"


class DiscordSender:
    def __init__(self, http, webhook):
        self.http, self.webhook = http, webhook

    def send(self, game, article_title, article_url):
        price = (
            f"~~{game.steam_price}~~ **Free**"
            if game.steam_price
            else "**Free**"
        )
        description = (
            f"{price} until {game.deadline or '未提供'}\n\n"
            f"🎮 **遊戲類型**：{game.genre or '未提供'}\n"
            f"🕹️ **玩法簡介**：{game.gameplay or '未提供'}\n"
            f"⭐ **玩家評價**：{game.rating or '未提供'}\n"
            f"> {game.brief or '限時免費活動'}"
        )
        fields = [
            {
                "name": "領取平台",
                "value": clip(game.platform or "未知", 1024),
                "inline": True,
            },
            {
                "name": "文章來源",
                "value": f"[4Gamers 傳送門]({article_url})",
                "inline": True,
            },
        ]
        embed = {
            "title": clip(f"🎁 限時免費情報：{game.name}", 256),
            "url": game.link,
            "description": clip(description, 4096),
            "fields": fields,
            "footer": {"text": "限時免費情報系統"},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if game.image:
            embed["image"] = {"url": game.image}

        payload = {
            "allowed_mentions": {"parse": []},
            "embeds": [embed],
        }
        self.http.post_json(self.webhook, payload)
