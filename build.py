"""Build one shared developer website from an app registry and page fragments."""
from pathlib import Path
import json
import html
import re
import shutil

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'docs'
ORIGIN='https://whitesheep-game-studio.github.io'
EMAIL='whitesheep0601@gmail.com'


def escape(s):
    return html.escape(str(s),quote=True)


def write_page(route,title,body):
    dest=OUT/route;dest.mkdir(parents=True,exist_ok=True)
    canonical=ORIGIN+'/'+(route+'/' if route else '')
    doc=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)} · WhiteSheep Game Studio</title><meta name="description" content="WhiteSheep Game Studio의 게임과 앱, 업데이트와 지원 안내를 한곳에서 확인하세요."><meta property="og:title" content="{escape(title)} · WhiteSheep Game Studio"><meta property="og:type" content="website"><meta property="og:url" content="{canonical}"><link rel="canonical" href="{canonical}"><link rel="icon" href="/assets/studio.svg"><link rel="stylesheet" href="/style.css"></head><body><a class="skip" href="#main">본문 바로가기</a><header><a class="brand" href="/"><img src="/assets/studio.svg" alt="" width="38" height="38"><span>WhiteSheep<br><small>Game Studio</small></span></a><nav aria-label="주 메뉴"><a href="/apps/">게임과 앱</a><a href="/about/">스튜디오</a><a href="/support/">문의</a></nav><div class="language-picker"><button class="language-trigger" id="language-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="language-menu"><span aria-hidden="true">◎</span><span data-i18n="lang.label">언어 변경</span><span class="current-language">한국어</span><span aria-hidden="true">⌄</span></button><div class="language-menu" id="language-menu" role="menu" hidden><button type="button" role="menuitemradio" aria-checked="true" data-language="ko">한국어 <small>· 한국어</small><span class="language-check">✓</span></button><button type="button" role="menuitemradio" aria-checked="false" data-language="ja">日本語 <small>· 일본어</small><span class="language-check"></span></button><button type="button" role="menuitemradio" aria-checked="false" data-language="en">English <small>· 영어</small><span class="language-check"></span></button></div></div></header><main id="main">{body}</main><footer><div>WhiteSheep Game Studio<br>운영자 초록지붕이층집 · © 2026</div><div class="links"><a href="/apps/">게임과 앱</a><a href="/support/">문의</a><a href="/privacy/">웹사이트 개인정보 안내</a></div></footer><script src="/directory.js" defer></script><script src="/i18n.js" defer></script></body></html>'''
    (dest/'index.html').write_text(doc,encoding='utf-8')


def app_card(app):
    name,slug=escape(app['name']),app['slug']
    search=escape(' '.join([app['name'],slug,app['category'],*app['platforms']]).lower())
    return f'''<article class="app" data-app data-search="{search}" data-status="{escape(app['status'])}" data-platforms="{escape(' '.join(app['platforms']))}"><a class="app-main" href="/apps/{slug}/"><img src="{escape(app['icon'])}" alt="" width="80" height="80"><div><span class="status">{escape(app['status'])}</span><h2>{name}</h2><p>{escape(app['description'])}</p><span class="meta">{escape(app['category'])} · {escape(' / '.join(app['platforms']))}</span></div><span class="arrow" aria-hidden="true">↗</span></a><div class="app-links"><a href="/apps/{slug}/support/">지원</a><a href="/apps/{slug}/privacy/">개인정보</a><a href="/apps/{slug}/sources/">출처·이용 조건</a></div></article>'''


def main():
    apps=json.loads((ROOT/'apps.json').read_text(encoding='utf-8'))
    slugs=[a['slug'] for a in apps]
    if len(set(slugs))!=len(slugs) or any(not re.fullmatch(r'[a-z][a-z0-9-]*',s) for s in slugs):
        raise ValueError('App slugs must be unique stable ASCII identifiers')
    OUT.mkdir(exist_ok=True)
    shutil.copytree(ROOT/'assets',OUT/'assets',dirs_exist_ok=True)
    css=(ROOT/'style.css').read_text(encoding='utf-8')
    (OUT/'style.css').write_text(css,encoding='utf-8')
    (OUT/'directory.js').write_text((ROOT/'directory.js').read_text(encoding='utf-8'),encoding='utf-8')
    (OUT/'i18n.js').write_text((ROOT/'i18n.js').read_text(encoding='utf-8'),encoding='utf-8')
    cards=''.join(app_card(a) for a in apps)
    filters='''<div class="filters"><label>이름·종류로 찾기<input id="app-search" type="search" placeholder="게임 또는 앱 이름" autocomplete="off"></label><label>플랫폼<select id="app-platform"><option value="">전체 플랫폼</option><option>Android</option><option>iOS</option></select></label><label>상태<select id="app-status"><option value="">전체 상태</option><option>개발 중</option><option>출시</option></select></label></div><p class="meta" id="app-count" aria-live="polite">전체 '''+str(len(apps))+'''개</p>'''
    home='''<section class="studio-hero"><div><p class="eyebrow">Independent games &amp; apps</p><h1>작은 즐거움이,<br>오래 남도록.</h1><p class="lead">WhiteSheep Game Studio가 만드는 게임과 앱.<br>새로운 만남부터 필요한 도움까지, 여기서 이어집니다.</p><a class="button" href="/apps/">게임과 앱 살펴보기 ↗</a></div><div class="studio-art" aria-hidden="true"><div class="sun"></div><div class="tile one">W</div><div class="tile two">遊</div><div class="tile three"><img src="/assets/kanjigyeol/icon.svg" alt=""></div><span>PLAY. LEARN. RETURN.</span></div></section><section class="section"><div class="section-title"><div><p class="eyebrow">From the studio</p><h2>지금 만들고 있어요.</h2></div><a href="/apps/">모든 게임과 앱 →</a></div>'''+cards+'''</section><section class="section split"><div><p class="eyebrow">One studio, many little worlds</p><h2>발견하는 곳도,<br>도움받는 곳도 하나로.</h2></div><div><p>각 게임과 앱의 소개, 이용할 수 있는 플랫폼, 지원 방법과 개인정보 안내를 한곳에 모았습니다. 새로운 작품도 이 목록에서 만나실 수 있습니다.</p><a href="/support/">스튜디오에 문의하기 →</a></div></section>'''
    write_page('', '게임과 앱을 만나는 곳',home)
    write_page('apps','게임과 앱','<section class="doc wide"><p class="eyebrow">Our collection</p><h1>게임과 앱</h1><p class="lead">마음이 가는 작은 세계를 찾아보세요.</p></section>'+filters+'<section class="app-list">'+cards+'</section><p id="no-results" hidden>조건에 맞는 게임이나 앱이 없습니다. 검색어나 필터를 바꿔 주세요.</p>')
    about='''<article class="doc"><p class="eyebrow">About</p><h1>WhiteSheep<br>Game Studio.</h1><p class="lead">게임과 앱을 만드는 초록지붕이층집의 개발자 브랜드입니다.</p><h2>작은 경험을 차곡차곡</h2><p>놀이와 배움의 작은 경험을 만듭니다. 이곳은 스튜디오의 모든 게임과 앱을 소개하고, 지원과 개인정보 안내를 함께 제공하는 공식 개발자 홈페이지입니다.</p><h2>운영 정보</h2><p>개발자 브랜드: WhiteSheep Game Studio<br>운영자: 초록지붕이층집<br>문의: <a href="mailto:whitesheep0601@gmail.com">whitesheep0601@gmail.com</a></p><p>작품별 개발·출시 상태와 플랫폼은 <a href="/apps/">게임과 앱 목록</a>에서 확인하실 수 있습니다.</p></article>'''
    write_page('about','스튜디오 소개',about)
    support='''<article class="doc"><p class="eyebrow">Studio support</p><h1>어떤 도움이<br>필요하신가요?</h1><p class="lead">게임·앱 이용 문의, 오류 제보, 개인정보 관련 요청을 이메일로 보내주세요.</p><p class="contact"><a href="mailto:whitesheep0601@gmail.com">whitesheep0601@gmail.com</a></p><h2>문의에 함께 적어 주세요</h2><ul><li>게임·앱 이름과 버전</li><li>사용 중인 기기와 운영체제</li><li>문제가 생기는 순서와 예상한 동작</li><li>필요한 경우 개인 정보를 가린 화면</li></ul><p>비밀번호·인증번호·결제 정보 등 민감한 정보는 보내지 마세요. 응답 시간을 확정해서 보장하지 않습니다.</p><h2>앱별 도움말과 개인정보</h2><p>기기 저장·삭제·광고 등은 앱마다 다를 수 있습니다. 해당 앱의 지원·개인정보 안내를 먼저 확인해 주세요.</p>'''+cards+'''<h2>문의 정보 보유 기준</h2><p>담당자: 초록지붕이층집 운영자. 문의 메일·첨부·관리 가능한 복사본과 휴지통은 처리 종료 후 90일 이내 삭제합니다. 법령상 보존이나 분쟁 대응 등 예외가 필요하면 근거와 기간을 별도로 확인합니다.</p></article>'''
    write_page('support','공통 문의·지원',support)
    privacy='''<article class="doc"><p class="eyebrow">Website privacy</p><h1>웹사이트 개인정보 안내</h1><p class="meta">2026년 10월 30일 · 개발자 홈페이지 기준</p><h2>운영자와 문의</h2><p>운영자·문의 담당자: 초록지붕이층집 운영자<br>개발자 브랜드: WhiteSheep Game Studio<br>이메일: <a href="mailto:whitesheep0601@gmail.com">whitesheep0601@gmail.com</a></p><h2>이 웹사이트에서 처리하는 정보</h2><p>공개된 게임·앱 정보와 지원 안내를 제공하는 정적 홈페이지입니다. 자체 회원가입·문의 입력폼·분석 스크립트·광고·외부 웹폰트를 넣지 않았습니다. 검색·필터는 브라우저 안에서 동작하며 검색어를 별도로 운영자 서버에 보내거나 저장하지 않습니다.</p><p>GitHub Pages 호스팅은 사이트 제공·보안 등을 위해 IP 주소 등 접속 관련 기술 정보를 처리할 수 있습니다. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub 개인정보처리방침</a>을 확인해 주세요. 호스팅 계약의 상세 처리·국외 이전 조건은 최종 정책 검토 대상입니다.</p><h2>직접 보내신 문의</h2><p>이메일을 보내면 발신 주소·본문·첨부와 직접 적어 주신 앱·기기 정보를 운영자의 Gmail 메일함으로 받아 답변·오류 확인에 사용합니다. 처리 종료 후 90일 이내에 메일·첨부·관리 가능한 복사본과 휴지통에서 삭제합니다. 법령상 보존 등 예외는 별도로 확인하며 메일 서비스의 별도 백업 보관 기간까지 임의로 보장하지 않습니다.</p><h2>게임·앱의 개인정보는 별도 안내합니다</h2><p>이 안내를 모든 앱의 단일 개인정보처리방침으로 사용하지 않습니다. 광고·저장·분석·계정 기능은 앱별로 다를 수 있으므로 <a href="/apps/">해당 앱의 개인정보 페이지</a>를 확인해 주세요. 출시 전 초안과 최종 방침을 구분해 표시합니다.</p><h2>권리 행사와 변경</h2><p>열람·정정·삭제 등 요청은 위 이메일로 보내실 수 있습니다. 처리 내용을 바꾸면 이 페이지의 일자와 안내를 갱신합니다. 법적 처리 근거·계약상 역할·국외 처리 세부 조건은 정식 출시 정책 확정 전 추가 검토합니다.</p></article>'''
    write_page('privacy','웹사이트 개인정보 안내',privacy)
    routes=['','apps','about','support','privacy']
    for app in apps:
        slug=app['slug']
        for part in ['index','support','privacy','sources']:
            content=ROOT/'content'/slug/(part+'.html')
            if not content.is_file():
                raise ValueError(f'Missing page: {content}')
            route='apps/'+slug+('/'+part if part!='index' else '')
            title=app['name']+({'index':'','support':' · 지원','privacy':' · 개인정보 안내','sources':' · 출처·이용 조건'}[part])
            trail=f'<div class="app-nav"><a href="/apps/">게임과 앱</a><span>/</span><a href="/apps/{slug}/">{escape(app["name"])}</a><a href="/apps/{slug}/support/">지원</a><a href="/apps/{slug}/privacy/">개인정보</a></div>'
            write_page(route,title,trail+content.read_text(encoding='utf-8'))
            routes.append(route)
    (OUT/'404.html').write_text((OUT/'apps/index.html').read_text(encoding='utf-8').replace('게임과 앱</h1>','페이지를 찾을 수 없습니다</h1>'),encoding='utf-8')
    (OUT/'.nojekyll').write_text('')
    (OUT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n')
    (OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+ORIGIN+'/'+(r+'/' if r else '')+'</loc></url>' for r in routes)+'</urlset>')
    print(json.dumps({'apps':len(apps),'pages':len(routes),'output':str(OUT)}))


if __name__=='__main__':
    main()
