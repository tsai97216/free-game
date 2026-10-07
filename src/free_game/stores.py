import json
import re
from urllib.parse import quote, urlparse
from .http import HttpClient

class SteamPriceResolver:
    def __init__(self,http): self.http=http
    def resolve(self,name,link):
        appid=self._appid(link)
        if appid:
            try:
                data,_=self.http.get(f"https://store.steampowered.com/api/appdetails?appids={appid}&cc=tw&l=tchinese")
                obj=json.loads(data).get(str(appid),{})
                if obj.get("success"):
                    d=obj.get("data",{})
                    if d.get("is_free"): return "免費"
                    return d.get("price_overview",{}).get("final_formatted","")
            except Exception: pass
        try:
            data,_=self.http.get("https://store.steampowered.com/api/storesearch/?cc=tw&l=tchinese&term="+quote(name))
            items=json.loads(data).get("items",[])
            if items:
                p=items[0]
                if p.get("is_free"): return "免費"
                return p.get("price",{}).get("final_formatted","")
        except Exception: pass
        return ""
    @staticmethod
    def _appid(link):
        m=re.search(r"/app/(\d+)",urlparse(link).path)
        return m.group(1) if m else ""
