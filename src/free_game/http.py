import time
import urllib.error
import urllib.request

RETRY_STATUS = {408, 425, 429, 500, 502, 503, 504}

class HttpError(RuntimeError): pass

class HttpClient:
    def __init__(self, user_agent, retries=3):
        self.user_agent, self.retries = user_agent, retries
    def get(self, url, timeout=20):
        for attempt in range(self.retries + 1):
            req = urllib.request.Request(url, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
            try:
                with urllib.request.urlopen(req, timeout=timeout) as r:
                    return r.read(), dict(r.headers.items())
            except urllib.error.HTTPError as e:
                if e.code not in RETRY_STATUS or attempt == self.retries: raise HttpError(f"HTTP {e.code}: {url}") from e
                retry_after = e.headers.get("Retry-After")
                delay = float(retry_after) if retry_after and retry_after.replace(".", "", 1).isdigit() else 2 ** attempt
                time.sleep(min(delay, 30))
            except (urllib.error.URLError, TimeoutError) as e:
                if attempt == self.retries: raise HttpError(f"request failed: {url}") from e
                time.sleep(min(2 ** attempt, 15))
        raise HttpError(f"request failed: {url}")
    def post_json(self, url, payload, timeout=20):
        import json
        body = json.dumps(payload, ensure_ascii=False).encode()
        for attempt in range(self.retries + 1):
            req = urllib.request.Request(url, data=body, method="POST", headers={"User-Agent": self.user_agent, "Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=timeout) as r: return r.status, r.read(), dict(r.headers.items())
            except urllib.error.HTTPError as e:
                if e.code not in RETRY_STATUS or attempt == self.retries: raise HttpError(f"HTTP {e.code}: {url}") from e
                retry_after = e.headers.get("Retry-After")
                delay = float(retry_after) if retry_after and retry_after.replace(".", "", 1).isdigit() else 2 ** attempt
                time.sleep(min(delay, 30))
            except (urllib.error.URLError, TimeoutError) as e:
                if attempt == self.retries: raise HttpError(f"request failed: {url}") from e
                time.sleep(min(2 ** attempt, 15))
