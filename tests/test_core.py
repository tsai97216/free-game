import json
import tempfile
import unittest

from free_game.article import normalize_store_url, parse_article
from free_game.discord import DiscordSender
from free_game.models import Game
from free_game.state import StateStore
from free_game.stores import SteamPriceResolver


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
        article = parse_article(
            html, "https://www.4gamers.com.tw/article/x", "Example"
        )
        self.assertEqual(
            article.links,
            ("https://store.steampowered.com/app/12345/",),
        )

    def test_anchor_context_is_preserved(self):
        html = b"""
        <html><body>
        <a href="https://store.epicgames.com/p/example">Example Game</a>
        </body></html>
        """
        article = parse_article(
            html, "https://www.4gamers.com.tw/article/x", "Example"
        )
        self.assertEqual(article.store_links[0].context, "Example Game")


class SteamTests(unittest.TestCase):
    def test_best_match_prefers_exact_title(self):
        items = [
            {"name": "Example Game Deluxe", "is_free": False},
            {"name": "Example Game", "is_free": True},
        ]
        best = SteamPriceResolver._best_match("Example Game", items)
        self.assertEqual(best["name"], "Example Game")

    def test_best_match_rejects_unrelated_title(self):
        items = [{"name": "Completely Different Game"}]
        self.assertEqual(
            SteamPriceResolver._best_match("Example Game", items),
            {},
        )

    def test_price_uses_original_price_when_discounted(self):
        data = {
            "price_overview": {
                "initial_formatted": "NT$ 300.00",
                "final_formatted": "NT$ 150.00",
                "discount_percent": 50,
            }
        }
        self.assertEqual(
            SteamPriceResolver._price(data),
            "NT$ 300.00",
        )

    def test_price_uses_final_price_without_discount(self):
        data = {
            "price_overview": {
                "initial_formatted": "NT$ 300.00",
                "final_formatted": "NT$ 300.00",
                "discount_percent": 0,
            }
        }
        self.assertEqual(
            SteamPriceResolver._price(data),
            "NT$ 300.00",
        )


class StateTests(unittest.TestCase):
    def test_state_preserves_recent_insertion_order(self):
        with tempfile.TemporaryDirectory() as d:
            store = StateStore(d + "/state.json", 2)
            store.save({"old", "new"})
            store.save({"new", "latest"})
            self.assertEqual(store.load(), {"new", "latest"})


class CoreStateTests(unittest.TestCase):
    def test_game_key_and_legacy_article_key(self):
        game = Game(name="Example", link="https://store.steampowered.com/app/1/")
        key = StateStore.game_key("https://example.com/article", game)
        self.assertTrue(key.startswith("game|"))
        values = {StateStore.article_key("https://example.com/article")}
        self.assertTrue(
            StateStore.is_article_processed(
                values, "https://example.com/article"
            )
        )


class DiscordTests(unittest.TestCase):
    def test_sender_disables_mentions(self):
        class FakeHttp:
            def post_json(self, url, payload):
                self.payload = payload
                return 204, b"", {}

        http = FakeHttp()
        game = Game(name="Example", link="https://store.steampowered.com/app/1/")
        DiscordSender(http, "https://discord.example/webhook").send(
            game, "Article", "https://example.com/article"
        )
        self.assertEqual(http.payload["allowed_mentions"], {"parse": []})



class AITests(unittest.TestCase):
    def test_markdown_json_fence_is_removed(self):
        from free_game.ai import GeminiExtractor

        class FakeHttp:
            def post_json(self, url, payload, timeout=45, headers=None):
                body = json.dumps({
                    "candidates": [{"content": {"parts": [{
                        "text": "```json\\n[{\\"name\\":\\"Example\\",\\"link\\":\\"https://store.steampowered.com/app/1/\\"}]\\n```"
                    }]}}]
                }).encode()
                return 200, body, {}

        article = parse_article(
            b'<html><body><a href="https://store.steampowered.com/app/1/">Example</a></body></html>',
            "https://example.com/article", "Example",
        )
        games = GeminiExtractor(FakeHttp(), "key", "gemini-test").extract(article)
        self.assertEqual(games[0].name, "Example")

    def test_store_index_maps_to_candidate_url(self):
        from free_game.ai import GeminiExtractor

        class FakeHttp:
            def post_json(self, url, payload, timeout=45, headers=None):
                body = json.dumps({
                    "candidates": [{"content": {"parts": [{
                        "text": "[{\"name\":\"Example\",\"store_index\":2}]"
                    }]}}]
                }).encode()
                return 200, body, {}

        article = parse_article(
            b'<html><body>'
            b'<a href="https://store.steampowered.com/app/1/">One</a>'
            b'<a href="https://store.epicgames.com/p/example">Example</a>'
            b'</body></html>',
            "https://example.com/article", "Example",
        )
        games = GeminiExtractor(FakeHttp(), "key", "gemini-test").extract(article)
        self.assertEqual(games[0].link, "https://store.epicgames.com/p/example")

    def test_invalid_store_link_is_rejected(self):
        from free_game.ai import GeminiExtractor

        class FakeHttp:
            def post_json(self, url, payload, timeout=45):
                body = json.dumps({
                    "candidates": [{"content": {"parts": [{
                        "text": "[{\\"name\\":\\"Example\\",\\"link\\":\\"https://evil.example/\\"}]"
                    }]}}]
                }).encode()
                return 200, body, {}

        article = parse_article(
            b'<html><body><a href="https://store.steampowered.com/app/1/">Example</a></body></html>',
            "https://example.com/article", "Example",
        )
        self.assertEqual(
            GeminiExtractor(FakeHttp(), "key", "gemini-test").extract(article),
            [],
        )

if __name__ == "__main__":
    unittest.main()
