#!/usr/bin/env python3
"""Serve this prototype with caching turned OFF.

WHY THIS FILE EXISTS
--------------------
`python3 -m http.server` sends `Last-Modified` but no `Cache-Control` and
no `ETag`. Under RFC 9111 a browser may then reuse a cached copy without
revalidating, and Safari does.

The consequence was not theoretical. A reviewer opened the prototype on
localhost and reported features MISSING that were present in the source
the whole time: the browser was executing an older copy of index.html and
js/*.js while the server was serving the new ones. The same build opened
from `file://` looked correct, because that origin revalidates by mtime —
so the two origins appeared to be running different builds. They were
not. (They do keep SEPARATE localStorage, which is a real difference, but
that is data, not code.)

Serving with `no-store` removes the failure mode entirely, including for
index.html itself — which a `?v=` query string on the script tags cannot
fix, because index.html is the document that carries those tags.

USAGE
-----
    cd ui-ux/18-unified-functional-platform
    python3 serve.py            # http://127.0.0.1:8791/
    python3 serve.py 8123       # a different port

This is a review/demo convenience for a static prototype. It is not part
of the product and nothing in js/ knows it exists.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # One line per request is noise during a walkthrough; keep errors only.
        if not str(args[1] if len(args) > 1 else "").startswith(("2", "3")):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
    handler = partial(NoCacheHandler, directory=".")
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print("XR Simulation Learning Platform — prototype")
        print("  serving  " + __file__.rsplit("/", 1)[0])
        print("  at       http://127.0.0.1:%d/" % port)
        print("  caching  DISABLED (no-store) — a reload always gets the current build")
        print("  stop     Ctrl-C")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
