#!/usr/bin/env python3
"""Local Phase 1 verification server. Baseline is an immutable git archive."""
import http.server,json,sys
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
BASE=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/shot-phase1/baseline').resolve()
OUT=Path('/tmp/shot-phase1/evidence').resolve();OUT.mkdir(parents=True,exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def translate_path(self,path):
  clean=unquote(urlsplit(path).path)
  if clean.startswith('/__evidence__/'):
   p=(OUT/clean[len('/__evidence__/'):]).resolve()
   return str(p) if p.is_relative_to(OUT) else str(OUT/'not-found')
  if clean.startswith('/__baseline__/'):
   p=(BASE/clean[len('/__baseline__/'):]).resolve()
   if p.is_relative_to(BASE):return str(p)
   return str(BASE/'not-found')
  return super().translate_path(path)
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
 def do_POST(self):
  if self.path!='/__report__':self.send_error(404);return
  body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  name=body.get('name','report')
  if not name.replace('-','').replace('_','').isalnum():self.send_error(400);return
  (OUT/(name+'.json')).write_text(json.dumps(body,indent=2));self.send_response(200);self.end_headers();self.wfile.write(b'OK')
print('Phase 1 verification: http://127.0.0.1:8767/tests/phase1.html',flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 8767),Handler).serve_forever()
