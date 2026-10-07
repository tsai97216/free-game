import json
import re
from .models import Game

class GeminiExtractor:
    def __init__(self, http, api_key, model):
        self.http, self.api_key, self.model = http, api_key, model

    def extract(self, article):
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        if not article.store_links:
            return []
        candidates = [f"[{i}] {item.url} | {item.context}" for i, item in enumerate(article.store_links, 1)]
        prompt = (
            "你是遊戲資訊結構化助手。只根據文章內容判斷哪些遊戲正在限時免費。"
            "輸出 JSON 陣列，不要 Markdown。欄位為 name, platform, deadline, genre, gameplay, rating, brief, link。"
            "link 必須完全等於候選連結之一，不可猜測。若文章有多個遊戲，分別配對最合理的候選連結；"
            "若無法可靠配對，省略該遊戲。"
            f"\n標題：{article.title}\n文章：{article.text}\n候選商店連結：{json.dumps(candidates, ensure_ascii=False)}"
        )
        url = "https://generativelanguage.googleapis.com/v1beta/models/" + self.model + ":generateContent?key=" + self.api_key
        payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}}
        _, body, _ = self.http.post_json(url, payload, timeout=45)
        try:
            response = json.loads(body)
            raw = response["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise RuntimeError("Gemini returned an invalid response") from exc
        raw = re.sub(r"^```(?:json)?\\s*|\\s*```$", "", raw, flags=re.I)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Gemini returned invalid JSON") from exc
        if not isinstance(data, list):
            raise RuntimeError("Gemini JSON is not a list")
        valid = {item.url for item in article.store_links}
        result = []
        for item in data:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()
            link = str(item.get("link", "")).strip()
            if not name or link not in valid:
                continue
            result.append(Game(name=name, platform=str(item.get("platform", "")).strip(), deadline=str(item.get("deadline", "")).strip(), genre=str(item.get("genre", "")).strip(), gameplay=str(item.get("gameplay", "")).strip(), rating=str(item.get("rating", "")).strip(), brief=str(item.get("brief", "")).strip(), link=link, image=article.image))
        return result
