from free_game.ai import GeminiExtractor
from free_game.article import parse_article
from free_game.config import *
from free_game.discord import DiscordSender
from free_game.http import HttpClient
from free_game.rss import is_free_game_article, parse_rss
from free_game.state import StateStore
from free_game.stores import SteamPriceResolver

def main():
    http = HttpClient(USER_AGENT)
    state = StateStore(STATE_FILE, MAX_PROCESSED)
    processed = state.load()
    data, _ = http.get(RSS_URL)
    articles = [
        a for a in parse_rss(data)
        if is_free_game_article(a) and not state.is_article_processed(processed, a.url)
    ]

    ai = GeminiExtractor(http, GEMINI_API_KEY, GEMINI_MODEL)
    discord = DiscordSender(http, WEBHOOK_URL)
    steam = SteamPriceResolver(http)

    for item in articles:
        try:
            html, _ = http.get(item.url)
            article = parse_article(
                html, item.url, item.title, item.summary, item.published
            )
            games = ai.extract(article)

            article_failed = False
            for game in games:
                key = state.game_key(item.url, game)
                if key in processed:
                    continue
                try:
                    price = steam.resolve(game.name, game.link)
                    game = game.__class__(
                        name=game.name,
                        platform=game.platform,
                        deadline=game.deadline,
                        genre=game.genre,
                        gameplay=game.gameplay,
                        rating=game.rating,
                        brief=game.brief,
                        link=game.link,
                        image=game.image,
                        steam_price=price,
                    )
                    discord.send(game, article.title, article.url)
                    processed.add(key)
                except Exception as exc:
                    article_failed = True
                    print(f"[ERROR] {item.url} | {game.name}: {exc}")

            if not article_failed:
                processed.add(state.article_key(item.url))
            state.save(processed)
        except Exception as e:
            print(f"[ERROR] {item.url}: {e}")
            state.save(processed)

if __name__ == "__main__":
    main()
