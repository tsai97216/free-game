from html.parser import HTMLParser
from html import unescape
from urllib.parse import urljoin, urlparse
from .models import Article

ALLOWED_HOSTS = {"store.steampowered.com", "store.epicgames.com", "www.dlsite.com", "dlsite.com"}

class Parser(HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.body = False
        self.skip = False
        self.parts = []
        self.links = []
        self.image = ""
        self._anchor_text = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "body":
            self.body = True
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip = True
        if tag == "meta" and a.get("property") == "og:image" and a.get("content"):
            self.image = urljoin(self.base, a["content"])
        if tag == "a" and a.get("href"):
            self._anchor_text = ""
            self._add_link(a["href"])
        if tag == "iframe" and a.get("src"):
            self._add_link(a["src"])

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip = False
        if tag == "a":
            self._anchor_text = ""
        if tag == "body":
            self.body = False

    def handle_data(self, data):
        text = " ".join(data.split())
        if self.body and not self.skip and text:
            self.parts.append(text)
        if self.body and not self.skip and self._anchor_text is not None:
            self._anchor_text += text

    def _add_link(self, raw):
        url = urljoin(self.base, unescape(raw))
        host = urlparse(url).netloc.lower()
        if host in ALLOWED_HOSTS:
            self.links.append(normalize_store_url(url))

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
    links = tuple(dict.fromkeys(p.links))
    text = " ".join(dict.fromkeys(p.parts))
    return Article(title=title, url=url, summary=summary, published=published,
                   image=p.image, text=text[:30000], links=links)
