import re
import xml.etree.ElementTree as ET

from .models import Article

FREE_GAME_RE = re.compile(r"限免|限時免費|紳士限免", re.I)


def _text(node, tag):
    child = node.find(tag)
    return (child.text or "").strip() if child is not None else ""


def parse_rss(data):
    root = ET.fromstring(data)
    articles = []
    for item in root.findall(".//item"):
        title = _text(item, "title")
        url = _text(item, "link")
        if title and url:
            articles.append(
                Article(
                    title=title,
                    url=url,
                    summary=_text(item, "description"),
                    published=_text(item, "pubDate"),
                )
            )
    return articles


def is_free_game_article(article):
    return bool(FREE_GAME_RE.search(f"{article.title} {article.summary}"))
