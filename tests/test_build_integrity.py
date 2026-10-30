"""Verify that every generated page can load its integrity-protected assets."""
import base64
import hashlib
from html.parser import HTMLParser
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("website_build", ROOT / "build.py")
build = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build)


class Assets(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.refs = []
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "script" and attributes.get("src"):
            self.refs.append((attributes["src"], attributes.get("integrity")))
        elif tag == "link" and attributes.get("rel") == "stylesheet":
            self.refs.append((attributes["href"], attributes.get("integrity")))


class BuildIntegrityTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.output = Path(temporary.name) / "docs"
        patcher = patch.object(build, "OUT", self.output)
        patcher.start()
        self.addCleanup(patcher.stop)
        build.main()

    def test_all_pages_match_actual_served_asset_bytes(self):
        pages = list(self.output.rglob("*.html"))
        self.assertGreater(len(pages), 0)
        for page in pages:
            references = Assets(page.read_text(encoding="utf-8")).refs
            self.assertEqual(len(references), 3, page)
            self.assertEqual(
                {urlsplit(url).path for url, _ in references},
                {"/style.css", "/directory.js", "/i18n.js"},
            )
            for url, integrity in references:
                with self.subTest(page=page.relative_to(self.output), url=url):
                    parsed = urlsplit(url)
                    digest = hashlib.sha384(
                        (self.output / parsed.path.lstrip("/")).read_bytes()
                    ).digest()
                    self.assertEqual(
                        integrity, "sha384-" + base64.b64encode(digest).decode("ascii")
                    )
                    self.assertEqual(parsed.query, "v=" + digest.hex()[:16])

    def test_asset_change_updates_integrity_and_cache_key(self):
        before = Assets((self.output / "index.html").read_text(encoding="utf-8")).refs
        script = self.output / "i18n.js"
        script.write_bytes(script.read_bytes() + b"\n// Asset update\n")
        build.write_page("after-update", "Asset update", "<h1>Asset update</h1>")
        after = Assets(
            (self.output / "after-update/index.html").read_text(encoding="utf-8")
        ).refs
        for old, new in zip(before, after):
            if urlsplit(old[0]).path == "/i18n.js":
                self.assertNotEqual(old[0], new[0])
                self.assertNotEqual(old[1], new[1])
            else:
                self.assertEqual(old, new)


if __name__ == "__main__":
    unittest.main()
