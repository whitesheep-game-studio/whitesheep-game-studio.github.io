# WhiteSheep Game Studio 공통 개발자 사이트

공개 주소: https://whitesheep-game-studio.github.io/

모든 게임·앱을 이 사이트 한 곳에서 운영한다. 새 앱마다 별도 사이트·도메인·호스팅을 만들지 않는다.

- `/`: 스튜디오 홈페이지
- `/apps/`: 검색·플랫폼·상태 필터를 갖춘 전체 게임·앱 목록
- `/apps/<slug>/`: 개별 소개
- `/apps/<slug>/support/`, `/privacy/`, `/sources/`: 앱별 지원·개인정보·출처
- `/support/`: 공통 문의
- `/privacy/`: 웹사이트 자체의 개인정보 안내

## 앱 추가

1. `apps.json`에 고유한 영문 slug와 표시 정보·상태·플랫폼을 추가한다. 출시하지 않은 앱은 출시로 표시하지 않는다.
2. `content/<slug>/`에 `index.html`, `support.html`, `privacy.html`, `sources.html` 본문을 준비한다.
3. 해당 앱의 브랜드 에셋은 `assets/<slug>/`에 둔다. 비공개 앱 소스·자격증명·미공개 제품명은 올리지 않는다.
4. 로컬에서는 `python build.py`와 `python check_site.py`로 사전 검증한다.
5. `main`에 커밋·푸시하면 GitHub Actions가 `build.py` 실행 → `check_site.py` 검증 → GitHub Pages 배포를 자동으로 수행한다. `docs/` 파일을 별도로 커밋할 필요는 없다. 사이트가 200개로 늘어도 레지스트리와 같은 템플릿을 사용한다.

정책은 공통 담당자·문의 기준을 공유하되 앱별 실제 처리에 맞는 페이지를 유지한다. 하나의 정책을 모든 앱에 무조건 적용하지 않는다. 현재 칸지결 정책은 개발 버전 안내이며 출시용 최종 정책은 별도 검토 중이다.

`app-ads.txt`는 실제 AdMob 게시자 ID 확인 후 `docs/app-ads.txt`와 빌드 입력에 추가한다. 임의 번호·테스트 게시자 번호를 게시하지 않는다. GitHub Pages 루트 호스트를 스토어 개발자 웹사이트에 공통으로 사용한다.

외부 JS/CSS/CDN·웹폰트·트래커·자체 폼이 없는 정적 페이지다. 새 UI는 공통 `style.css`와 `directory.js`에서 관리한다. 페이지를 재생성하므로 `docs/` 파일만 직접 편집하지 않는다.

## 번역 현황과 검사 범위

**전체 페이지의 다국어 번역은 아직 미완료다.** 현재 사전/UI 키 97개를 ko/ja/en으로 검사하지만,
제목·메타데이터·법률/지원 본문 등을 포함한 한국어 fallback 문구 95개가 남아 있다.
그 원문과 발생 위치는 [.ci/i18n-known-gaps.json](.ci/i18n-known-gaps.json)에 명시한다.
이 목록은 번역 승인이나 완료 표시가 아니다. 실제 한국어 원문과 법률 안내를 유지하며,
새 누락 또는 사전 삭제가 생기면 CI가 실패한다. 새 문구는 세 언어를 함께 추가한다.

`scripts/export-i18n.mjs`는 acorn AST로 실제 `i18n.js`의 정적 사전을 읽어 중복·동적 값·locale/key
불일치를 거부한다. 브라우저 코드를 실행하거나 미번역 한국어를 각 언어의 번역으로 복제하지 않는다.
기존 원문 매칭 키는 CI JSON에서 `text.<source SHA-256 prefix>`로 매핑한다. 런타임 키를
의미 기반으로 이관한 것은 아니며 변경된 원문은 새 키로 취급한다. UI 키는 `ui.*`로 유지한다.
생성된 `.ci/locales/`는 커밋하지 않으며 공통 검사기가 키·빈 값·이름 있는 placeholder를 확인한다.
별도 전체 HTML 검사가 기존 fallback 목록과 실제 본문/속성/제목/메타데이터를 대조한다.

```sh
npm ci
python build.py
node scripts/export-i18n.mjs
```

번역을 실제로 보완한 경우에만 `--write-baseline`으로 검토용 목록을 갱신하고 원문·번역·위치 변경을
PR에서 함께 확인한다. CI는 이 옵션을 사용하지 않는다. 법률 문구는 충실한 번역의 수동 검토가 필요하다.

## 의존성 검증

Node 26.13.0 LTS를 사용하고 `.nvmrc`와 `package-lock.json`/`npm ci`로 실행·설치 버전을 고정한다.
lockfile을 갱신한 뒤 clean install과 기존 검사 전체를 실행한다.
ESLint의 실제 import인 `@eslint/js`와 AST 파서 acorn을 명시적 개발 의존성으로 둔다.
Vitest 5 및 ESLint 10을 검증하며, LHCI 0.15.1의 오래된 하위 도구는 패치된 Lighthouse 13.6,
chrome-launcher 1.2.2, tmp 0.2.7, uuid 11.1.1, basic-ftp 6.2.4, glob 14.0.3,
minimatch 11.0.3으로 고정한다. override는 전체 lint·단위·브라우저·실제 Lighthouse 검사로 확인하며,
상위 LHCI가 해당 의존성을 갱신하면 별도 검증 PR에서 정리한다. 알려진 취약점이나 감사 서비스 오류는
CI 실패로 처리하며 무시 목록으로 우회하지 않는다. 이들은 빌드/검증 도구이며 웹사이트에 번들하지 않는다.

## CI/CD 자동 배포

- 워크플로: `.github/workflows/deploy.yml`
- 트리거: `main` push 또는 Actions 탭에서 `workflow_dispatch` 수동 실행
- 빌드 결과: `docs/` 폴더를 Actions artifact로 업로드하여 Pages에 배포 (소스 브랜치에 생성물 커밋 불필요)
- **최초 설정 필수:** 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 변경한다. 기존 `Deploy from a branch`를 그대로 두면 새 워크플로와 배포 방식이 충돌하거나 예상대로 게시되지 않을 수 있다.
- 검증 실패 시 배포 단계는 실행되지 않는다. Actions 탭에서 실패 로그를 확인한다.
- 배포 확인: https://whitesheep-game-studio.github.io/

공개 `whitesheep-game-studio-public`의 검증된 전체 SHA를 workflow/helper에 함께 고정한다.
`.ci/project.yml`이 기존 build·링크/SRI·lint/format·HTML·Vitest·Playwright/axe·Lighthouse에
번역 현황·공통 자원·OSV 감사를 연결한다. 기존 required check `verify`는 전체 공통 검증의 성공만 허용한다.
모두 통과한 `verified-static-site` artifact를 main의 기존 Pages deploy가 내려받아 그대로 배포한다.
검증 후 소스를 다시 빌드하지 않으며 PR에서는 배포하지 않는다. 개발/진단 artifact 보관은 3일이다.
실제 Pages 배포 결과는 이 PR 검증과 별도이며 main 병합 후 확인해야 한다.
