import re
import xml.etree.ElementTree as ET
from .models import Article

def _text(node, tag):
    child = node.find(tag)
    return (child.text or "").strip() if child is not None else ""

def parse_rss(data):
    root = ET.fromstring(data)
    result = []
    for item in root.findall(".//item"):
        title, url = _text(item, "title"), _text(item, "link")
        if title and url: result.append(Article(title=title, url=url, summary=_text(item, "description"), published=_text(item, "pubDate")))
    return result

def is_free_game_article(article):
    return bool(re.search(r"限免|限時免費|紳士限免", article.title + " " + article.summary, re.I))
