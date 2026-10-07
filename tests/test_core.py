import unittest

from free_game.article import normalize_store_url, parse_article
from free_game.stores import SteamPriceResolver
from free_game.state import StateStore
from free_game.models import Game

class ArticleTests(unittest.TestCase):
    def test_steam_widget_is_normalized(self):
        self.assertEqual(
            normalize_store_url("https://store.steampowered.com/widget/12345/"),
            "https://store.steampowered.com/app/12345/",
        )

    def test_iframe_store_link_is_extracted(self):
        html = b"""
        <html><body>
        <h1>Example Game</h1>
        <iframe src="https://store.steampowered.com/widget/12345/"></iframe>
        </body></html>
        """
        article = parse_article(html, "https://www.4gamers.com.tw/article/x", "Example")
        self.assertEqual(article.links, ("https://store.steampowered.com/app/12345/",))

    def test_anchor_context_is_preserved(self):
        html = b"""
        <html><body>
        <a href="https://store.epicgames.com/p/example">Example Game</a>
        </body></html>
        """
        article = parse_article(html, "https://www.4gamers.com.tw/article/x", "Example")
        self.assertEqual(article.store_links[0].context, "Example Game")

class SteamTests(unittest.TestCase):
    def test_best_match_prefers_exact_title(self):
        items = [
            {"name": "Example Game Deluxe", "is_free": False},
            {"name": "Example Game", "is_free": True},
        ]
        best = SteamPriceResolver._best_match("Example Game", items)
        self.assertEqual(best["name"], "Example Game")

    def test_game_key_and_legacy_article_key(self):
        game = Game(name="Example", link="https://store.steampowered.com/app/1/")
        key = StateStore.game_key("https://example.com/article", game)
        self.assertTrue(key.startswith("game|"))
        values = {StateStore.article_key("https://example.com/article")}
        self.assertTrue(StateStore.is_article_processed(values, "https://example.com/article"))

if __name__ == "__main__":
    unittest.main()
