"""Author QR artwork with qrcode==8.2 (authoring-only; not needed in CI).

Run after changing public store URLs. Build binds QR filenames to the exact URL
hash, so stale QR artwork cannot be served for a different destination.
"""
from pathlib import Path
import hashlib
import json
import qrcode
import qrcode.image.svg

ROOT = Path(__file__).resolve().parents[1]
for app in json.loads((ROOT / 'apps.json').read_text(encoding='utf-8')):
    if app['slug'] not in ('kanjigyeol', 'jgrammar'):
        continue
    for key in ('app_store_url', 'play_store_url'):
        if not app.get(key):
            continue
        url = app[key]
        qr = qrcode.QRCode(border=4, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(url)
        qr.make(fit=True)
        image = qr.make_image(image_factory=qrcode.image.svg.SvgPathFillImage)
        destination = ROOT / 'assets/japanese' / (hashlib.sha256(url.encode()).hexdigest()[:16] + '.svg')
        image.save(destination)
        print(app['slug'], key, destination.name)
