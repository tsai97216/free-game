from .http import HttpClient
from .models import Game

def clip(value,n):
    value=value.strip()
    return value if len(value)<=n else value[:n-1]+"…"

class DiscordSender:
    def __init__(self,http,webhook): self.http,self.webhook=http,webhook
    def send(self,game,article_title):
        fields=[]
        for name,value in (("平台",game.platform),("免費期限",game.deadline),("類型",game.genre),("玩法",game.gameplay),("評分",game.rating),("Steam 價格",game.steam_price)):
            if value: fields.append({"name":clip(name,256),"value":clip(value,1024),"inline":True})
        embed={"title":clip(game.name,256),"url":game.link,"description":clip(game.brief or article_title,4096),"fields":fields[:25],"footer":{"text":clip("來源："+article_title,2048)}}
        if game.image: embed["image"]={"url":game.image}
        status,_,_=self.http.post_json(self.webhook,{"embeds":[embed]})
        if status>=300: raise RuntimeError(f"Discord HTTP {status}")
