import json
import re
from .models import Game
from .http import HttpClient

class GeminiExtractor:
    def __init__(self,http,api_key,model): self.http,self.api_key,self.model=http,api_key,model
    def extract(self,article):
        if not self.api_key: return []
        prompt=("你是遊戲資訊結構化助手。只根據文章內容判斷哪些遊戲正在限時免費。輸出 JSON 陣列，不要 Markdown。"
        "欄位為 name, platform, deadline, genre, gameplay, rating, brief, link。link 必須完全等於候選連結之一，不可猜測。"
        f"\n標題：{article.title}\n文章：{article.text}\n候選商店連結：{json.dumps(article.links,ensure_ascii=False)}")
        url=f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"temperature":0.1,"responseMimeType":"application/json"}}
        _,body,_=self.http.post_json(url,payload,timeout=45)
        raw=json.loads(body)["candidates"][0]["content"]["parts"][0]["text"].strip()
        raw=re.sub(r"^```(?:json)?\\s*|\\s*```$","",raw,flags=re.I)
        data=json.loads(raw)
        if not isinstance(data,list): raise ValueError("Gemini JSON is not a list")
        valid=set(article.links); result=[]
        for x in data:
            if not isinstance(x,dict): continue
            name=str(x.get("name","")).strip(); link=str(x.get("link","")).strip()
            if not name or link not in valid: continue
            result.append(Game(name=name,platform=str(x.get("platform","")).strip(),deadline=str(x.get("deadline","")).strip(),genre=str(x.get("genre","")).strip(),gameplay=str(x.get("gameplay","")).strip(),rating=str(x.get("rating","")).strip(),brief=str(x.get("brief","")).strip(),link=link,image=article.image))
        return result
