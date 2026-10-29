---
slug: dependabot-alerts
title: "Dependabot 경고 84개, 실제로 위험한 건 몇 개일까"
date: 2026-10-29
tags: ["npm"]
thumbnail: "/uploads/2026/10/dependabot-alerts.png"
draft: false
---

# Dependabot 경고 84개, 실제로 위험한 건 몇 개일까

---

어느 날 저장소의 Security 탭에 **84**가 떠 있었다. Dependabot 알림만 91건이다.

```text
Prototype Pollution via parse() in NodeJS flatted          High  Transitive
minimatch has a ReDoS via repeated wildcards               High  Transitive
source-map-js allows event-loop denial of service          High  Transitive
SVGO: removeScripts allows executable links                High  Transitive
nanoid: custom generators can loop indefinitely            High  Transitive
```

`High`가 42건. 당장 뭔가 해야 할 것 같다.

그런데 전부 **`Transitive`** 다. 내가 설치한 패키지는 하나도 없다.

그래서 물었다 — **이 중 몇 개가 내 방문자에게 도달하는가?**
답하려면 경고가 **무슨 말인지**, **어디서 왔는지**, **내 사이트에 남는지**를
차례로 봐야 했다.

## 1. 경고에 붙은 번호부터 읽기

경고를 열면 `CVE-2026-33228` 같은 번호가 붙어 있다. 이걸 읽을 줄 알아야
"High 42건"이 무슨 뜻인지 가늠이 된다.

**CVE(Common Vulnerabilities and Exposures)는 공개된 보안 결함에 붙이는
고유 번호**다. 같은 결함을 두고 어떤 도구는 "flatted 버그", 어떤 도구는
"프로토타입 오염"이라고 부르면 대조가 안 되니, **이름표를 통일하자**는 것이
전부다. MITRE가 운영하고 미국 CISA가 비용을 댄다. 2016년부터는 CVE Board가
방향을 정한다.

번호는 MITRE만 주지 않는다. **CNA(CVE Numbering Authority)** 로 승인된 조직이
자기 범위 안에서 직접 발급한다. GitHub도 CNA다.

### 번호가 여러 개인 이유

내 저장소의 `flatted` 경고를 실제로 열어 보면 이렇다.

```text
Prototype Pollution via parse() in NodeJS flatted
  CVE-2026-33228          ← 전 세계 공통 이름표
  GHSA-rf6f-7fwh-wjgh     ← GitHub Advisory Database의 이름표
  CWE-915, CWE-1321       ← "어떤 종류의 결함인가" 분류
  취약: <=3.4.1  →  패치: >=3.4.2
```

**번호가 셋이지만 결함은 하나다.** 역할이 다르다.

| | 무엇인가 | 예 |
|---|---|---|
| CVE | 결함 하나하나의 고유 이름표 | `CVE-2026-33228` |
| GHSA | GitHub이 패키지 생태계에 맞춰 붙인 이름표. 영향 버전·패치 버전을 같이 적는다 | `GHSA-rf6f-7fwh-wjgh` |
| CWE | 결함의 **유형** 분류. 번호가 같으면 같은 종류의 실수다 | `CWE-1321` = 프로토타입 오염 |
| CVSS | 심각도 **점수**(0~10) | `7.5` |

GHSA는 CVE보다 먼저 생기기도 하고, CVE 없이 GHSA만 있는 경우도 있다.

### High는 어떻게 정해지나

여기가 중요하다. 같은 `flatted` 의 다른 경고를 보자.

```text
flatted vulnerable to unbounded recursion DoS in parse() revive phase
  CVE-2026-32141
  CVSS 7.5   CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
```

7.5라는 숫자는 뒤의 **벡터**에서 계산된다. 풀어 쓰면 이렇다.

| 기호 | 뜻 | 값 |
|---|---|---|
| `AV:N` | 공격 경로 | **네트워크** — 원격에서 닿을 수 있다 |
| `AC:L` | 난이도 | 낮음 |
| `PR:N` | 필요 권한 | 없음 |
| `UI:N` | 사용자 조작 | 필요 없음 |
| `C:N` `I:N` `A:H` | 피해 | 기밀성·무결성 영향 없음, **가용성만** 높음 |

즉 "원격에서 누구나 쉽게 서비스를 멈출 수 있다"는 뜻이고, 7.5의 대부분은
**`AV:N`(네트워크에서 닿는다)** 에서 나온다.

**그런데 내 경우 flatted는 네트워크에 노출되지 않는다.** eslint가 내 노트북에서
`.eslintcache` 를 쓸 때만 돈다. 벡터가 전제하는 상황 자체가 성립하지 않는다.

CVSS 점수는 **그 결함이 최악으로 쓰일 수 있는 환경**을 가정해 매긴다.
내 환경에 맞춘 점수가 아니다.

### 점수가 아예 없기도 하다

앞의 프로토타입 오염 경고는 이렇게 나온다.

```json
{ "severity": "high", "cvss": { "score": 0, "vectorString": null } }
```

**CVSS 점수가 없는데 severity는 `high`다.** 점수가 아직 안 매겨졌거나,
매길 만큼 정보가 모이지 않은 것이다. 그래도 GitHub은 자체 판단으로 등급을
붙인다. `High` 라는 딱지는 계산 결과일 때도 있고 판단일 때도 있다.

여기까지 읽고 나면 "High 42건"은 **"위험 42개"가 아니라 "확인해 볼 항목 42개"**
가 된다. 그럼 확인해 보자. 먼저 출처다.

## 2. 어디서 온 건지 따라가기

`pnpm why` 로 부모를 찾았다.

| 경고 패키지 | 이 패키지가 하는 일 | 어떤 경로로 들어왔나 |
|---|---|---|
| `flatted` | 순환 참조가 있는 객체를 JSON으로 직렬화·역직렬화 | `eslint` → `file-entry-cache` → `flat-cache` |
| `minimatch` | glob 패턴 매칭 | `@eslint/eslintrc` |
| `source-map-js` | 소스맵 생성·해석 | `tailwindcss` → `postcss` |
| `svgo` | SVG 최적화 | `@svgr/webpack` → `@svgr/plugin-svgo` |
| `nanoid` | URL에 쓸 수 있는 짧은 고유 ID 생성 | `tailwindcss` → `postcss` |

두 칸을 굳이 나눈 이유가 있다. 처음엔 "`flatted` — 린트 캐시" 라고 한 칸에
적었는데, 그건 **flatted가 하는 일이 아니라 eslint가 flatted를 쓰는 용도**다.
flatted 자체는 순환 참조를 다루는 JSON 파서이고, eslint가 `.eslintcache` 를
디스크에 쓸 때 그 기능이 필요해서 `flat-cache` 를 거쳐 끌려 온 것이다.

경고를 읽을 때 이 구분이 중요하다. **"내가 그 기능을 쓰는가"** 와
**"그 패키지가 내 트리에 있는가"** 는 다른 질문이고, Dependabot은 뒤쪽만 안다.

어쨌든 끌고 온 쪽은 전부 **빌드 도구**다. 직접 설치한 것도 아니다.

여기까지는 추측이다. 확인이 필요하다.

## 3. 산출물을 직접 뒤지기

이 블로그는 `output: "export"` 로 빌드한다. 끝나면 `out/` 에 HTML·CSS·JS만
남고 도구는 사라진다. **남았는지 세어 보면 된다.**

```js
const files = walk("out");          // 97개 파일, JS 608KB
const blob = files.map(f => fs.readFileSync(f, "utf8")).join("\n");

for (const pkg of probes) {
  const n = blob.split(pkg).length - 1;
  console.log(pkg, n > 0 ? `⚠ ${n}건` : "없음");
}
```

결과.

```text
flatted           없음
minimatch         없음
source-map-js     없음
svgo              없음
nanoid            없음
brace-expansion   없음
js-yaml           없음
picomatch         없음
browserslist      없음
@babel/           없음
tailwindcss       없음
postcss           없음
undici            없음
cheerio           없음
eslint            ⚠ 40건
```

15개 중 14개가 흔적조차 없다. 그런데 `eslint` 가 40건 걸렸다.

### 그 40건의 정체

```text
003cstrong>Oxlint + eslint-plugin-react-hooks 규...
03ca href="#2.-oxlint-(-eslint-호환-린터-)"...
3eA case where Oxlint + eslint-plugin-react-hooks rules...
```

**내가 쓴 글에 적힌 "eslint"라는 글자**였다. Oxc를 다룬 글이 있어서다.

패키지 코드는 한 줄도 없다. **15개 중 15개가 산출물에 없다.**

## 4. 그럼 Dependabot이 틀렸나

아니다. **다른 질문에 답하고 있을 뿐이다.**

Dependabot은 "네 잠금 파일에 이름이 올라 있는 패키지 중 CVE가 있는 것"을 센다.
내가 알고 싶은 건 "내 사이트를 여는 사람에게 위험이 가는가"다. 둘은 다른 질문이다.

```text
Dependabot이 보는 것   pnpm-lock.yaml   ← 빌드에 쓰는 것 전부
내가 궁금한 것          out/            ← 방문자가 받는 것
```

정적 사이트에서는 이 간극이 특히 크다. 서버가 없으니 런타임에 도는 코드가
브라우저 JS뿐이고, 빌드 도구는 내 노트북과 CI에서만 돈다. `svgo` 가 ReDoS에
취약해도, svgo는 **내가 빌드할 때 내 SVG를 처리하다가** 돌 뿐이다.

> 공격자가 svgo를 악용하려면 내 빌드 과정에 악의적인 SVG를 넣을 수 있어야 한다.
> 그게 가능하면 svgo 버전은 이미 문제가 아니다.

Dependabot이 이걸 구분하지 못하는 건 당연하다. 내 배포 방식을 모르기 때문이다.

## 5. 그래서 아무것도 안 하나

경고를 지우려고 버전을 올리는 건 대개 못 한다. 전이 의존성이라
**부모가 올려주기 전에는 손댈 수 없다.** `eslint` 가 `flatted` 구버전을
요구하면 내가 할 수 있는 게 없다.

`pnpm overrides` 로 강제할 수는 있다. 그런데 그렇게 얻는 건 **실제 노출이 없는
숫자**뿐이고, 잃는 건 도구가 깨질 위험이다. 남는 장사가 아니다.

대신 다른 걸 물었다. **이 도구가 꼭 필요한가?**

### @svgr/webpack — 아이콘 4개에 117개 패키지

`@svgr/webpack` 은 SVG를 React 컴포넌트로 import 하게 해 준다. 안에 babel과
svgo를 통째로 들고 있다.

```bash
$ ls node_modules/.pnpm | grep -cE "^@svgr|^@babel|^svgo|^css-tree|^csso"
117
```

정작 쓰는 곳을 세어 봤다.

```bash
$ grep -rn "\.svg\"" app components --include=*.tsx
components/Button/MenuToggleButton.tsx:5:   import MenuToggle from ".../MenuToggle.svg";
components/Button/Theme.tsx:5:              import DarkMode from ".../darkMode.svg";
components/Button/Theme.tsx:6:              import LightMode from ".../lightMode.svg";
components/Search/components/Search.tsx:9:  import SearchIcon from ".../search.svg";
```

**4군데.** 햄버거 메뉴, 돋보기, 테마 토글 두 개.

파일을 열어 보니 전부 path 한두 개짜리였다.

```html
<svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
```

직접 적으면 되는 양이다.

### `<img>` 로는 안 되는 이유

처음엔 `<img src="/search.svg">` 로 바꾸려 했다. 안 된다.

위 코드의 `stroke="currentColor"` 때문이다. 이 아이콘들은 **글자색을 따라가야**
한다 — 라이트 모드에서는 검게, 다크 모드에서는 희게. `<img>` 로 넣으면 바깥
CSS가 안쪽에 닿지 않아 색이 고정된다.

그래서 JSX로 옮겼다.

```tsx
export default function MenuToggleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}
```

`React.SVGProps` 를 그대로 받아 넘기므로 쓰던 쪽은 안 바뀐다.

```tsx
<MenuToggleIcon className="w-6 h-6" />
```

## 6. 결과

```bash
$ pnpm remove @svgr/webpack
```

`next.config.ts` 의 로더 설정도 같이 지웠다. 설정 파일이 22줄에서 4줄이 됐다.

| | 이전 | 이후 |
|---|---:|---:|
| 설치 패키지 | 592 | **429** |
| `@svgr`·`@babel`·`svgo` 계열 | 117 | **0** |
| 취약점 (`pnpm audit`) | 92 | **83** |
| 산출물 JS | 608KB | 609KB |

**163개가 빠졌다.** 설치가 빨라지고, 잠금 파일이 줄고, 공급망에서 신경 쓸
표면이 그만큼 작아졌다.

산출물 JS는 1KB 늘었다. svgr도 결국 같은 SVG를 인라인으로 넣고 있었으니
바뀐 게 거의 없다. **도구가 하던 일을 손으로 했을 뿐 결과물은 같다.**

## 솔직한 결론

**경고는 9건밖에 안 줄었다.** 92 → 83이다.

남은 83건은 `eslint` 와 `tailwindcss`·`postcss` 체인이고, 그 도구들을 버리지
않는 한 못 없앤다. 그리고 버릴 이유가 없다 — 실제로 쓰고 있으니까.

그러니 이 작업을 "보안 문제를 고쳤다"고 말하면 과장이다. 정확히는 이렇다.

- **노출은 처음부터 없었다.** 확인하는 데 스크립트 20줄이 들었다
- **줄인 건 경고가 아니라 의존성 163개다.** 이쪽이 진짜 이득이다
- **남은 경고는 그대로 둔다.** 숫자를 0으로 만드는 게 목적이 아니다

Dependabot의 숫자는 **읽어야 할 신호**지 **지워야 할 목록**이 아니다.
84를 0으로 만들려고 `overrides` 를 쌓는 것보다, 84가 어디서 왔는지 한 번
따라가 보는 쪽이 낫다. 따라가 보니 내 경우엔 **도구 하나를 통째로 안 써도
되는** 자리가 나왔다.

## 참고

- [CVE Program](https://www.cve.org/) — 번호 체계와 CNA 제도
- [CWE — 결함 유형 분류](https://cwe.mitre.org/)
- [CVSS v3.1 명세 — FIRST](https://www.first.org/cvss/v3.1/specification-document) — 벡터 기호의 정의
- [GitHub Advisory Database 소개](https://docs.github.com/en/code-security/security-advisories/working-with-global-security-advisories-from-the-github-advisory-database/about-the-github-advisory-database) — GHSA가 CVE와 어떻게 다른가
- [Dependabot alerts — GitHub Docs](https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)
- [pnpm why](https://pnpm.io/cli/why) — 어떤 패키지가 왜 설치됐는지 추적
- [pnpm overrides](https://pnpm.io/settings#overrides) — 전이 의존성 버전을 강제할 때
- [@svgr/webpack](https://react-svgr.com/docs/webpack/)
- [Static Exports — Next.js](https://nextjs.org/docs/app/guides/static-exports)
