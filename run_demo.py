#!/usr/bin/env python3
"""
=============================================================================
Karnataka Groundwater ML — Presentation & Interactive Explorer Launcher
=============================================================================

Zero-dependency launcher that serves the pre-built, offline-first web
application in `demo_app/dist/` and automatically opens it in your default
web browser.

Usage:
    python run_demo.py
    # or
    make demo

Key Features:
- 100% Offline: No external CDNs, no remote telemetry, no API keys.
- Instant Startup: Uses Python standard library http.server on localhost.
- Auto-Browser: Automatically launches your browser at http://localhost:<port>.
- Presentation Mode (18 full-screen slides) + Explorer Mode (Interactive Map & Hydrographs).
=============================================================================
"""

import sys
import os
import socket
import webbrowser
import threading
import time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "demo_app" / "dist"

class OfflineDemoHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler that serves files from demo_app/dist."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST_DIR), **kwargs)

    def log_message(self, format, *args):
        # Silence standard HTTP access logging to keep terminal clean
        pass


def find_free_port(start_port: int = 8000, max_attempts: int = 50) -> int:
    """Finds an available local TCP port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port


def main():
    print("=" * 75)
    print("  KARNATAKA GROUNDWATER ML -- PRESENTATION & INTERACTIVE EXPLORER")
    print("=" * 75)

    if not DIST_DIR.exists() or not (DIST_DIR / "index.html").exists():
        print(f"\n[!] Error: Pre-built application not found at:")
        print(f"    {DIST_DIR}")
        print("\nPlease build the frontend first by running:")
        print("    cd demo_app && npm install && npm run build\n")
        sys.exit(1)

    port = find_free_port(8000)
    server_address = ('127.0.0.1', port)
    url = f"http://localhost:{port}/"

    try:
        httpd = ThreadingHTTPServer(server_address, OfflineDemoHandler)
    except Exception as e:
        print(f"[!] Could not bind server to port {port}: {e}")
        sys.exit(1)

    print(f"\n[+] Local Server Running : {url}")
    print(f"[+] Serving Directory    : {DIST_DIR}")
    print(f"[+] Status               : 100% Offline Ready\n")

    print("-" * 75)
    print("  PRESENTATION SHORTCUTS (When viewing slides):")
    print("  * Next Slide         : Right Arrow (->) or Space or Page Down")
    print("  * Previous Slide     : Left Arrow (<-) or Page Up")
    print("  * Speaker Notes      : 'N' (Toggles what to say to Ma'am)")
    print("  * Jump to Slide Grid : 'G' (Jump to any of the 18 slides)")
    print("  * Defense Cheat Sheet: '?' (Key numbers & quick benchmark metrics)")
    print("  * Toggle Explorer    : 'E' (Switch to interactive map, hydrographs, & Q&A)")
    print("  * Back to Slides     : 'P' (Switch back from Explorer to Presentation)")
    print("  * Fullscreen Toggle  : 'F'")
    print("-" * 75)
    print("\nOpening web browser automatically... (Press Ctrl+C to stop server)\n")

    # Launch browser in a background timer thread to let server start first
    def open_browser():
        time.sleep(0.5)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n[+] Server gracefully stopped. Good luck with your presentation!")
        httpd.server_close()


if __name__ == "__main__":
    main()
