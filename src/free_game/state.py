import json
from pathlib import Path

class StateStore:
    def __init__(self,path,limit): self.path,self.limit=Path(path),limit
    def load(self):
        try:
            data=json.loads(self.path.read_text(encoding="utf-8")); return set(data if isinstance(data,list) else [])
        except (OSError,json.JSONDecodeError): return set()
    def save(self,values):
        self.path.parent.mkdir(parents=True,exist_ok=True)
        data=sorted(values)[-self.limit:]
        self.path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
