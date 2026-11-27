"""Keep campaign scope and production-only store destinations explicit."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('landing_build', ROOT / 'build.py')
build = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build)


class JapaneseLandingTests(unittest.TestCase):
    def test_allowlist_is_explicit_and_does_not_grow_with_registry(self):
        self.assertEqual(build.JAPANESE_APPS, ('kanjigyeol', 'jgrammar'))
        page = (ROOT / 'docs/japanese/index.html').read_text(encoding='utf-8')
        self.assertEqual(page.count('data-japanese-app='), 2)
        for app in json.loads((ROOT / 'apps.json').read_text(encoding='utf-8')):
            if app['slug'] not in build.JAPANESE_APPS:
                self.assertNotIn(app['name'], page)
        self.assertNotIn('/japanese/', (ROOT / 'docs/sitemap.xml').read_text())
        self.assertNotIn('/japanese/', (ROOT / 'docs/index.html').read_text(encoding='utf-8'))

    def test_private_or_wrong_store_links_fail_closed(self):
        for store, url in [
            ('ios', 'https://testflight.apple.com/join/private'),
            ('ios', 'https://apps.apple.com/kr/app/id123?test=private'),
            ('ios', 'https://apps.apple.com.evil.example/kr/app/id123'),
            ('android', 'https://play.google.com/apps/testing/com.example.app'),
            ('android', 'https://play.google.com/store/apps/details?id=com.example.app&test=1'),
            ('android', 'http://play.google.com/store/apps/details?id=com.example.app'),
        ]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                build.public_store_url(url, store)

    def test_current_store_urls_are_accepted(self):
        for app in json.loads((ROOT / 'apps.json').read_text(encoding='utf-8')):
            if app['slug'] not in build.JAPANESE_APPS:
                continue
            for key, store in [('app_store_url', 'ios'), ('play_store_url', 'android')]:
                if app.get(key):
                    self.assertEqual(build.public_store_url(app[key], store), app[key])


if __name__ == '__main__':
    unittest.main()
