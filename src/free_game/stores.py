import json
import re
from urllib.parse import quote, urlparse

class SteamPriceResolver:
    def __init__(self, http):
        self.http = http

    def resolve(self, name, link):
        appid = self._appid(link)
        if appid:
            try:
                data, _ = self.http.get(
                    "https://store.steampowered.com/api/appdetails"
                    "?appids=" + appid + "&cc=tw&l=tchinese"
                )
                obj = json.loads(data).get(appid, {})
                if obj.get("success"):
                    info = obj.get("data", {})
                    if info.get("is_free"):
                        return "免費"
                    return info.get("price_overview", {}).get("final_formatted", "")
            except Exception:
                pass

        try:
            data, _ = self.http.get(
                "https://store.steampowered.com/api/storesearch/"
                "?cc=tw&l=tchinese&term=" + quote(name)
            )
            items = json.loads(data).get("items", [])
            best = self._best_match(name, items)
            if best.get("is_free"):
                return "免費"
            return best.get("price", {}).get("final_formatted", "")
        except Exception:
            return ""

    @staticmethod
    def _normalize(value):
        return re.sub(r"[^a-z0-9\u4e00-\u9fff]+", " ", value.lower()).strip()

    @classmethod
    def _best_match(cls, name, items):
        target = cls._normalize(name)
        if not target:
            return {}
        target_tokens = set(target.split())
        best = {}
        best_score = -1
        for item in items[:20]:
            title = cls._normalize(str(item.get("name", "")))
            if not title:
                continue
            if title == target:
                return item
            tokens = set(title.split())
            overlap = len(target_tokens & tokens) / max(len(target_tokens | tokens), 1)
            contains = 0.35 if target in title or title in target else 0
            score = overlap + contains
            if score > best_score:
                best, best_score = item, score
        return best

    @staticmethod
    def _appid(link):
        match = re.search(r"/app/(\d+)", urlparse(link).path)
        return match.group(1) if match else ""
