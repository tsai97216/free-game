from html.parser import HTMLParser
from html import unescape
from urllib.parse import urljoin, urlparse
from .models import Article

ALLOWED_HOSTS = {"store.steampowered.com", "store.epicgames.com", "www.dlsite.com", "dlsite.com"}

class Parser(HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True); self.base=base; self.body=False; self.skip=False; self.parts=[]; self.links=[]; self.image=""
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=="body": self.body=True
        if tag in {"script","style","noscript","svg"}: self.skip=True
        if tag=="meta" and a.get("property")=="og:image" and a.get("content"): self.image=urljoin(self.base,a["content"])
        if tag=="a" and a.get("href"):
            u=urljoin(self.base,unescape(a["href"])); host=urlparse(u).netloc.lower()
            if host in ALLOWED_HOSTS: self.links.append(normalize_store_url(u))
    def handle_endtag(self, tag):
        if tag in {"script","style","noscript","svg"}: self.skip=False
        if tag=="body": self.body=False
    def handle_data(self, data):
        if self.body and not self.skip:
            text=" ".join(data.split())
            if text: self.parts.append(text)

def normalize_store_url(url):
    p=urlparse(url)
    if p.netloc.lower()=="store.steampowered.com" and "/widget/" in p.path:
        appid=p.path.rstrip("/").split("/widget/")[-1]
        if appid.isdigit(): return f"https://store.steampowered.com/app/{appid}/"
    return url

def parse_article(html, url, title, summary="", published=""):
    p=Parser(url); p.feed(html.decode("utf-8",errors="replace"))
    return Article(title=title,url=url,summary=summary,published=published,image=p.image,text=" ".join(dict.fromkeys(p.parts))[:30000],links=tuple(dict.fromkeys(p.links)))
