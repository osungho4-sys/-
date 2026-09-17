#!/usr/bin/env python3
import json, re, html, urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

OUT = Path("karina/data/latest.json")
MAX_ITEMS = 80
UA = "Mozilla/5.0 KARINA-UNIVERSE-FreeArchive/1.0"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language":"ko-KR,ko;q=0.9,en;q=0.7"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()

def clean(text):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()

def load_old():
    if OUT.exists():
        try: return json.loads(OUT.read_text(encoding="utf-8"))
        except Exception: pass
    return {"items":[]}

def google_news():
    q = urllib.parse.quote('"KARINA" aespa')
    url = f"https://news.google.com/rss/search?q={q}&hl=ko&gl=KR&ceid=KR:ko"
    root = ET.fromstring(fetch(url))
    items=[]
    for node in root.findall(".//item")[:35]:
        title = clean(node.findtext("title"))
        link = clean(node.findtext("link"))
        pub = clean(node.findtext("pubDate"))
        source_node=node.find("source")
        source=clean(source_node.text if source_node is not None else "")
        if not title or not link: continue
        items.append({"title":title,"url":link,"published":pub,"source":source or "Google News","kind":"news","kind_label":"뉴스"})
    return items

def youtube():
    channel_id="UC9GtSLeksfK4yuJ_g1lgQbg"
    url=f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    root=ET.fromstring(fetch(url))
    ns={"a":"http://www.w3.org/2005/Atom","yt":"http://www.youtube.com/xml/schemas/2015"}
    items=[]
    for e in root.findall("a:entry",ns)[:20]:
        title=clean(e.findtext("a:title",default="",namespaces=ns))
        vid=clean(e.findtext("yt:videoId",default="",namespaces=ns))
        pub=clean(e.findtext("a:published",default="",namespaces=ns))
        if not vid: continue
        items.append({"title":title,"url":f"https://www.youtube.com/watch?v={vid}","published":pub,"source":"aespa Official YouTube","kind":"youtube","kind_label":"YouTube"})
    return items

def aespa_jp():
    url="https://aespa-official.jp/news/"
    raw=fetch(url).decode("utf-8","ignore")
    pairs=re.findall(r'href=["\'](https://aespa-official\.jp/news/[^"\']+)["\'][^>]*>(.*?)</a>', raw, flags=re.I|re.S)
    items=[]
    seen=set()
    for link,inner in pairs:
        title=clean(inner)
        if not title or link in seen: continue
        seen.add(link)
        if "karina" not in (title+" "+link).lower() and "カリナ" not in title: continue
        items.append({"title":title[:180],"url":link,"published":"","source":"aespa Japan Official","kind":"official","kind_label":"공식"})
        if len(items)>=12: break
    return items

def main():
    old=load_old()
    combined=[]
    for fn in (aespa_jp, youtube, google_news):
        try:
            combined.extend(fn())
        except Exception as e:
            print(f"[WARN] {fn.__name__}: {e}")
    combined.extend(old.get("items",[]))
    unique={}
    for item in combined:
        url=item.get("url","").strip()
        if not url: continue
        if url not in unique: unique[url]=item
    items=list(unique.values())
    items.sort(key=lambda x: x.get("published",""), reverse=True)
    data={
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "items": items[:MAX_ITEMS],
        "collector":"GitHub Actions · free RSS/official feeds",
        "version":3
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Wrote {len(data['items'])} items to {OUT}")

if __name__=="__main__":
    main()
