from html.parser import HTMLParser
from html import unescape
from urllib.parse import urljoin, urlparse
from .models import Article, StoreLink

ALLOWED_HOSTS = {"store.steampowered.com", "store.epicgames.com"}

class Parser(HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.body = False
        self.skip = False
        self.parts = []
        self.links = []
        self.contexts = {}
        self.image = ""
        self.anchor_depth = 0
        self.anchor_text = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "body":
            self.body = True
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip = True
        if tag == "meta" and a.get("property") == "og:image" and a.get("content"):
            self.image = urljoin(self.base, a["content"])
        if tag == "a" and a.get("href"):
            self.anchor_depth += 1
            self.anchor_text = []
            self._add_link(a["href"])
        if tag == "iframe" and a.get("src"):
            self._add_link(a["src"])

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip = False
        if tag == "a" and self.anchor_depth:
            self.anchor_depth -= 1
            if self.links and self.anchor_text:
                self.contexts[self.links[-1]] = " ".join(self.anchor_text)
            self.anchor_text = []
        if tag == "body":
            self.body = False

    def handle_data(self, data):
        text = " ".join(data.split())
        if not text or not self.body or self.skip:
            return
        self.parts.append(text)
        if self.anchor_depth:
            self.anchor_text.append(text)

    def _add_link(self, raw):
        url = normalize_store_url(urljoin(self.base, unescape(raw)))
        if urlparse(url).netloc.lower() in ALLOWED_HOSTS and url not in self.links:
            self.links.append(url)

    def store_links(self):
        return tuple(StoreLink(url, self.contexts.get(url, "")) for url in self.links)

def normalize_store_url(url):
    p = urlparse(url)
    if p.netloc.lower() == "store.steampowered.com" and "/widget/" in p.path:
        appid = p.path.rstrip("/").split("/widget/")[-1]
        if appid.isdigit():
            return f"https://store.steampowered.com/app/{appid}/"
    return url

def parse_article(html, url, title, summary="", published=""):
    p = Parser(url)
    p.feed(html.decode("utf-8", errors="replace"))
    text = " ".join(dict.fromkeys(p.parts))
    links = tuple(p.links)
    return Article(title=title, url=url, summary=summary, published=published,
                   image=p.image, text=text[:30000], links=links,
                   store_links=p.store_links())
