"""Check the generated public site's internal links and app-page contract."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json

ROOT=Path(__file__).resolve().parent/'docs'
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.refs=[];self.titles=0;self.h1=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='title':self.titles+=1
        if tag=='h1':self.h1+=1
        if tag in ['a','link','img','script']:
            v=a.get('href') or a.get('src')
            if v:self.refs.append(v)
errors=[]
for file in ROOT.rglob('*.html'):
    parser=Page();parser.feed(file.read_text(encoding='utf-8'))
    if parser.titles!=1 or parser.h1!=1:errors.append(f'Heading/title: {file.relative_to(ROOT)}')
    for ref in parser.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc or not u.path:continue
        target=ROOT/unquote(u.path.lstrip('/')) if u.path.startswith('/') else file.parent/unquote(u.path)
        if target.is_dir():target=target/'index.html'
        if not target.is_file():errors.append(f'{file.relative_to(ROOT)}: missing {ref}')
    if 'gennolab' in file.read_text(encoding='utf-8'):errors.append(f'Old hostname: {file}')
if errors:raise SystemExit('\n'.join(errors))
print(json.dumps({'pages':len(list(ROOT.rglob('*.html'))),'internal_links':'passed','old_hostname':'absent'}))
