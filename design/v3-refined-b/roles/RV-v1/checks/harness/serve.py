#!/usr/bin/env python3
"""Local render harness server: /fin/* -> the final canvas folder; any /fin/support.js -> the Design type's dc-runtime."""
import http.server, os, sys
FIN = '/home/claude/fin/project'
RUNTIME = '/home/claude/fin/artifact-type/dc-runtime.js'
def safe_join(base, rel):
    return os.path.join(base, *[s for s in rel.split('/') if s not in ('', '..')])
class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = path.split('?', 1)[0].split('#', 1)[0]
        if p.endswith('/support.js'): return RUNTIME
        if p.startswith('/fin/'): return safe_join(FIN, p[len('/fin/'):])
        return safe_join('/home/claude/h', p.lstrip('/'))
    def log_message(self, *a): pass
if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
