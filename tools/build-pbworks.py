#!/usr/bin/env python3
"""Build one self-contained HTML file of the whole notebook, for sites like
PBworks that give every uploaded file its own address (so links between
index.html, games.html, ... can't find each other).

    python3 tools/build-pbworks.py        ->  pbworks/essnotebook.html

The single file holds every page. Which page shows depends on the end of
the address:
    (nothing), #q1, #class=..., #teacher   the notebook (index.html)
    #ess-games, #ess-paint, ...            a review game started from the notebook
    #host, #test, #solo=...                the Quiz Quest style host page (games.html)
Links like href="index.html" or "snake.html#ess" are caught and turned
into those addresses. Rerun this after changing any page.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index", "games", "paint", "snake", "blasteroids", "zombie"]
OUT = os.path.join(ROOT, "pbworks", "essnotebook.html")

def read(name):
    with open(os.path.join(ROOT, name + ".html"), encoding="utf-8") as f:
        return f.read()

pages = {p: read(p) for p in PAGES}

# every page shares the Reward Center script; the single file carries it inside each page
with open(os.path.join(ROOT, "rewards.js"), encoding="utf-8") as f:
    rewards = "<script>\n" + f.read() + "</script>"
for p in PAGES:
    pages[p] = pages[p].replace('<script src="rewards.js"></script>', rewards)

# the notebook starts a game by setting location.href; send it through the bundle instead
launch = re.compile(r'location\.href = (sport === "paint" \? "paint\.html#ess" :.*?"games\.html#ess");')
pages["index"], n = launch.subn(r'__nbGo(\1);', pages["index"])
if n < 1:
    sys.exit("build-pbworks: couldn't find the game launch line in index.html; update this script")

def js_string(s):
    # safe inside a <script>: no "</script", no "<!--"
    return json.dumps(s, ensure_ascii=False).replace("</", "<\\/").replace("<!--", "<\\!--")

boot = """<!doctype html>
<meta charset="utf-8">
<script>
/* Earth Space Science Notebook, all pages in one file (built by tools/build-pbworks.py) */
(function(){
  var PAGES = {%s};
  var BASE = location.href.split("#")[0];
  /* a link to one of the notebook's pages, as an address in this file */
  function hashFor(href){
    var m = /^(?:\\.\\/)?(\\w+)\\.html(#.*)?$/.exec(href || "");
    if (!m || !PAGES[m[1]]) return null;
    var page = m[1], h = m[2] || "";
    if (page === "index") return h;
    if (/^#ess\\b/i.test(h)) return "#ess-" + page;
    if (page === "games") return h || "#host";
    return "#ess-" + page;
  }
  function go(h){
    location.replace(BASE + h);
    if (h) location.reload();   // a new #... alone doesn't reload the page
  }
  window.__nbGo = function(href){ var h = hashFor(href); if (h != null) go(h); else location.href = href; };
  document.addEventListener("click", function(e){
    if (e.defaultPrevented || e.button) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = hashFor(a.getAttribute("href"));
    if (h == null) return;
    e.preventDefault(); go(h);
  });
  function pageFor(h){
    var m = /^#ess-(\\w+)/i.exec(h);
    return m && PAGES[m[1].toLowerCase()] ? m[1].toLowerCase() : /^#(host|test|solo=)/i.test(h) ? "games" : "index";
  }
  var page = pageFor(location.hash);
  /* an address typed or pasted into a tab that's already open: load the other page */
  window.addEventListener("hashchange", function(){ if (pageFor(location.hash) !== page) location.reload(); });
  document.write(PAGES[page].replace(/^\\s*<!doctype[^>]*>/i, ""));
})();
</script>
""" % ",".join("%s:%s" % (json.dumps(p), js_string(pages[p])) for p in PAGES)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(boot)
print("wrote %s (%.1f MB)" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1e6))
