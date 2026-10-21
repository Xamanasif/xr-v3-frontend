#!/usr/bin/env python3
"""Local render harness server.
/proj/support.js -> the Design type's dc-runtime (harness only; never published)
/proj/*          -> the canvas project folder (the files that get published)
everything else  -> /home/claude/harness (v46 / v3 reference copies, fonts)"""
import http.server, os, sys, functools

ROOT = '/tmp/claude-0/-home-claude/f99a1275-7610-5182-8624-21a078c24de9/scratchpad/rvcanvas/project'
RUNTIME = '/tmp/claude-0/-home-claude/f99a1275-7610-5182-8624-21a078c24de9/scratchpad/artifact-files/647f39f4-dba8-420b-b7f2-9c5e45e4d1c5/artifact-type/dc-runtime.js'
HARNESS = '/home/claude/harness'

class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = path.split('?', 1)[0].split('#', 1)[0]
        if p == '/proj/support.js' or p.endswith('/proj/support.js'):
            return RUNTIME
        if p.startswith('/proj/'):
            rel = p[len('/proj/'):]
            return os.path.join(ROOT, *[s for s in rel.split('/') if s not in ('', '..')])
        rel = p.lstrip('/')
        return os.path.join(HARNESS, *[s for s in rel.split('/') if s not in ('', '..')])
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
