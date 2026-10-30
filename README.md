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

## CI/CD 자동 배포

- 워크플로: `.github/workflows/deploy.yml`
- 트리거: `main` push 또는 Actions 탭에서 `workflow_dispatch` 수동 실행
- 빌드 결과: `docs/` 폴더를 Actions artifact로 업로드하여 Pages에 배포 (소스 브랜치에 생성물 커밋 불필요)
- **최초 설정 필수:** 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 변경한다. 기존 `Deploy from a branch`를 그대로 두면 새 워크플로와 배포 방식이 충돌하거나 예상대로 게시되지 않을 수 있다.
- 검증 실패 시 배포 단계는 실행되지 않는다. Actions 탭에서 실패 로그를 확인한다.
- 배포 확인: https://whitesheep-game-studio.github.io/
