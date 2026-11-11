#!/usr/bin/env python3
"""Tiny static server for local play. Usage: python3 tools/serve.py [port]"""
import http.server, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
print(f"SHOT the Stairs: http://127.0.0.1:{port}/", flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
