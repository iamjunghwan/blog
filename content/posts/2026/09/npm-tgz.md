---
slug: npm-tgz
title: "npm은 왜 tgz로 패키지를 올릴까"
date: 2026-09-16
tags: ["npm", "javascript"]
draft: true
---

# npm은 왜 tgz로 패키지를 올릴까

---

사내 Nexus에 라이브러리를 배포하다 보면 `npm publish`가 결국 `.tgz` 하나를 올리는 걸 보게 된다.

```bash
$ npm pack
my-lib-1.0.0.tgz
```

zip도 아니고, 7z도 아니고, 왜 하필 tgz일까. 1979년에 나온 포맷을 2026년에도 쓰는 이유가 있다.

## tgz는 하나의 포맷이 아니다

`.tgz`는 `.tar.gz`의 줄임이다. **도구 두 개를 거친 결과**다.

```
디렉토리  →  tar  →  하나의 .tar 파일  →  gzip  →  .tgz
          (묶기)                      (압축)
```

`tar`는 **압축하지 않는다.** 여러 파일을 하나의 스트림으로 이어붙이면서 경로·권한·타임스탬프를 보존할 뿐이다. `gzip`은 **묶지 않는다.** 바이트 스트림 하나를 받아 작게 만들 뿐이다.

zip이 두 가지를 한 번에 하는 것과 대비된다. 이 분리가 뒤에서 설명할 성질을 만든다.

## tar — 테이프에 쓰려고 만든 것

이름부터가 **T**ape **AR**chive다. 1979년 1월 Seventh Edition UNIX에 처음 실렸다.

당시 백업 매체는 자기 테이프였다. 테이프에는 파일 시스템이 없다. 앞에서부터 순서대로 읽고 쓰는 장치라, 여러 파일을 **하나의 연속된 바이트 흐름**으로 만들어야 했다. tar가 한 일이 그것이다.

포맷은 단순하다. 512바이트 헤더(파일명·권한·크기·타임스탬프)와 파일 내용이 번갈아 나오고, 끝은 0으로 채운 블록이다.

- **1988년** POSIX.1이 `ustar`로 표준화했다. 긴 파일명, 심볼릭 링크, 디바이스 파일을 지원하게 됐다.
- **2001년** POSIX.1-2001이 `pax` 포맷을 추가했다. 확장 메타데이터를 담을 수 있고, ustar와 호환된다.

40년 넘게 표준이 유지되고 있다는 게 핵심이다. 어떤 유닉스 계열 시스템에서도 tar를 읽을 수 있다.

## gzip — 특허를 피하려고 만든 것

gzip은 1992년 Jean-loup Gailly와 Mark Adler가 만들었다. 0.1이 1992년 10월 31일, 1.0이 1993년 2월에 나왔다.

만든 이유가 흥미롭다. 당시 유닉스의 표준 압축 도구는 `compress`였는데, 이게 쓰는 **LZW 알고리즘이 Unisys와 IBM의 특허**에 걸려 있었다. 특허는 각각 2003년, 2004년에야 만료됐다.

그래서 특허를 침해하지 않는 알고리즘이 필요했고, 그게 **DEFLATE**다. LZ77(반복되는 바이트열을 뒤쪽 참조로 치환)과 허프만 코딩(자주 나오는 값에 짧은 비트 할당)을 조합한 방식이다.

지금 우리가 쓰는 HTTP `Content-Encoding: gzip`, PNG 내부 압축, zip의 기본 압축 방식이 전부 같은 DEFLATE다. 특허 회피용으로 만든 것이 표준이 됐다.

## 왜 묶고 나서 압축할까

"압축하면서 묶으면 되지 않나?" 싶지만, 순서가 결과를 바꾼다.

### 유닉스 철학

하나의 도구는 하나의 일만 한다. 그래서 파이프로 조합할 수 있다.

```bash
tar -cf - ./package | gzip -9 > package.tgz
tar -cf - ./package | xz    > package.txz   # 압축기만 바꾸면 된다
```

압축 방식을 바꾸고 싶으면 뒷단만 교체하면 된다. tar는 손댈 필요가 없다.

### 압축률 — 직접 재봤다

이쪽이 더 실질적이다. **묶고 나서 압축하면 파일 경계를 넘어 중복을 찾을 수 있다.**

`gray-matter@4.0.3` 패키지(파일 14개, 원본 38,621 bytes)로 두 방식을 비교했다.

```bash
# 1) 묶고 나서 압축 — tar가 만든 하나의 스트림을 통째로 압축
tar -cf - package | gzip -9 > solid.tgz

# 2) 파일별로 압축한 뒤 합계 — zip이 하는 방식
for f in $(find package -type f); do gzip -9 -c "$f" | wc -c; done
```

| 방식 | 크기 |
|---|---|
| 묶고 나서 압축 (tar.gz) | **11,782 bytes** |
| 파일별 압축 합계 | 14,548 bytes |

**23% 차이**다. JS 파일들은 `require(`, `module.exports`, 반복되는 변수명처럼 **파일끼리 겹치는 패턴**이 많은데, 파일별로 압축하면 그 중복을 매번 처음부터 다시 학습한다. 하나로 이어붙이면 앞 파일에서 본 패턴을 뒤 파일에서 재사용한다.

이걸 **solid compression**이라 부른다. 파일이 많고 작을수록 차이가 커진다.

### 대가도 있다

공짜는 아니다. 스트림 전체가 하나로 압축돼 있으니 **파일 하나만 꺼내려 해도 앞에서부터 풀어야 한다.**

## 그럼 zip을 쓰면 되지 않나

zip은 묶기와 압축을 한 번에 한다. 도구도 하나면 되고, 윈도우에서 더블클릭하면 바로 열린다. 그런데 npm은 왜 안 쓸까.

### 압축 방식이 다르다

zip은 **파일마다 따로 압축**하고 맨 끝에 목차(central directory)를 붙인다. 구조가 이렇다.

```
zip   : [압축된 A][압축된 B][압축된 C][목차]
tgz   : gzip( [A][B][C] )
```

zip은 목차를 보고 원하는 파일 위치로 바로 건너뛸 수 있다. 대신 파일마다 압축을 새로 시작하니 **파일 간 중복을 활용하지 못한다.** 앞에서 잰 23% 차이가 여기서 나온다.

### 그래서 용도가 갈린다

| | zip 계열 | tar.gz 계열 |
|---|---|---|
| 압축 단위 | 파일별 | 전체 스트림 |
| 부분 추출 | 가능 (빠름) | 앞에서부터 풀어야 함 |
| 압축률 | 낮음 | 높음 |
| 대표 사례 | `.jar` `.apk` `.docx` `.epub` | npm 패키지, 소스 배포판 |

`.jar`는 JVM이 클래스 하나씩 필요할 때 꺼내 읽는다. `.docx`는 문서 뷰어가 XML 일부만 읽기도 한다. **일부만 읽는 용도**라 zip이 맞다.

npm 패키지는 반대다. `npm install`은 **어차피 전부 푼다.** 부분 추출이 필요 없으니 그 능력을 포기하고 압축률을 택하는 쪽이 이득이다. 레지스트리가 하루에 내보내는 트래픽을 생각하면 23%는 작지 않다.

### 메타데이터를 다루는 방식도 다르다

tar는 유닉스에서 태어나서 권한·소유자·심볼릭 링크를 **포맷 본체에** 담는다. zip은 DOS에서 태어나 그런 개념이 없었고, 나중에 확장 필드로 덧붙였다. 그래서 zip에 담긴 유닉스 권한은 도구에 따라 보존되기도 하고 사라지기도 한다.

다만 **npm은 이 능력을 오히려 쓰지 않는다.** 실제 tarball을 열어보면 이렇다.

```bash
$ tar -tvzf rimraf-5.0.10.tgz | head -3
-rw-r--r-- 0/0   2085 1985-10-26 17:15 package/package.json
-rw-r--r-- 0/0    207 1985-10-26 17:15 package/dist/esm/bin.d.mts.map
-rw-r--r-- 0/0  15918 1985-10-26 17:15 package/dist/esm/bin.mjs.map
```

권한은 전부 `644`, 소유자는 `0/0`, 그리고 **타임스탬프가 1985년 10월 26일로 고정**돼 있다. npm이 일부러 그렇게 만든다. 유닉스 epoch(1970)를 쓰면 일부 zip 도구가 이상하게 처리해서 고른 날짜다.

왜 지우는가. **같은 소스에서 같은 바이트가 나와야 하기 때문**이다. 파일을 만든 시각이 tarball에 들어가면 어제 만든 것과 오늘 만든 것의 해시가 달라진다. 그러면 다음 절에서 볼 무결성 검증이 성립하지 않는다.

즉 npm은 tar를 **메타데이터를 보존하려고** 쓰는 게 아니라 **하나의 스트림으로 만들려고** 쓴다. 실행 권한은 tarball이 아니라 `package.json`의 `bin` 필드를 보고 설치 시점에 붙인다.

### 정리하면

zip이 나쁜 게 아니라 **목적이 다르다.** npm에 필요한 건 "부분적으로 빠르게 읽기"가 아니라 "작게 만들어 통째로 받고, 바이트 단위로 같은지 확인하기"다. tgz가 그 조건에 맞는다.

## npm이 이 조합을 쓰는 이유

### 어디서나 읽을 수 있다

레지스트리는 결국 HTTP로 파일을 내려주는 서버다. tar+gzip은 모든 유닉스, 모든 HTTP 서버, 모든 언어의 표준 라이브러리가 다룰 수 있다. Nexus, Artifactory, Verdaccio 같은 사설 레지스트리가 별도 구현 없이 동작하는 이유다.

npm은 시스템 `tar`에 의존하지도 않는다. [node-tar](https://github.com/isaacs/node-tar)라는 순수 JS 구현을 쓴다. Windows에서도 똑같이 동작한다.

### 해시 하나로 무결성이 보장된다

tgz는 **바이트 단위로 확정된 파일 하나**다. 그래서 해시를 찍을 수 있다.

npm 레지스트리의 패키지 메타데이터에는 `dist` 객체가 있고, 여기에 tarball URL과 함께 체크섬이 들어 있다.

- `shasum` — tarball의 SHA-1
- `integrity` — 2017년 4월부터. `<알고리즘>-<base64 해시>` 형식 (지금은 주로 sha512)

`package-lock.json`에 박히는 그 `integrity` 값이다.

```json
"gray-matter": {
  "version": "4.0.3",
  "resolved": "https://registry.npmjs.org/gray-matter/-/gray-matter-4.0.3.tgz",
  "integrity": "sha512-5v6yZd4J..."
}
```

디렉토리를 그대로 올리는 방식이었다면 이게 불가능하다. 파일 순서, 타임스탬프, 권한이 조금만 달라져도 "같은 패키지인가"를 판단할 기준이 없다. **하나의 파일로 봉인**했기 때문에 "이 해시면 정확히 이 내용"이라고 말할 수 있다.

앞에서 본 타임스탬프 고정이 여기에 이어진다. 같은 소스로 `npm pack`을 몇 번을 돌려도 같은 바이트가 나오게 만들어야, 해시가 "내용이 같다"를 뜻하게 된다. npm v5.6.0부터 이렇게 바뀌었다.

### 불변성

한 번 배포된 tgz는 바뀌지 않는다. 같은 버전을 다시 올릴 수 없고, 같은 URL은 영원히 같은 바이트를 준다. 재현 가능한 빌드의 토대다.

## 실제로 열어보기

`npm pack`은 레지스트리에서 tarball을 그대로 받아온다.

```bash
$ npm pack gray-matter@4.0.3
gray-matter-4.0.3.tgz

$ tar -tzf gray-matter-4.0.3.tgz | head -5
package/LICENSE
package/lib/defaults.js
package/lib/engine.js
package/lib/engines.js
package/index.js
```

모든 경로가 **`package/`로 시작한다.** 패키지 이름이 뭐든 항상 `package/`다. 압축을 푸는 쪽이 이름을 몰라도 되게 한 규칙이다.

파일 앞 4바이트를 보면 gzip인 걸 확인할 수 있다.

```bash
$ xxd -l 4 gray-matter-4.0.3.tgz
00000000: 1f8b 0800
```

`1f 8b`는 gzip 매직 넘버, `08`은 압축 방식이 DEFLATE라는 뜻이다.

크기는 이렇다.

```
tar (압축 전)  50,176 bytes
tgz (압축 후)  11,775 bytes    →  약 4.3배
```

## 정리

- `.tgz` = `tar`(묶기) + `gzip`(압축). **서로 다른 두 도구**를 거친 결과다.
- `tar`는 1979년 테이프 백업용으로 만들어졌고, 1988년 POSIX 표준이 됐다.
- `gzip`은 1992년 LZW 특허를 피하려고 만들어졌고, 그 DEFLATE가 지금 웹의 표준 압축이 됐다.
- **묶고 나서 압축하면** 파일 경계를 넘어 중복을 찾아 더 작아진다. 대신 부분 추출을 포기한다.
- **zip은 반대 선택**을 했다. 파일별로 압축해서 일부만 빠르게 꺼낼 수 있지만 압축률을 잃는다. `.jar`, `.docx`처럼 일부만 읽는 용도에 맞는 설계다.
- npm은 설치할 때 어차피 전부 풀기 때문에 부분 추출이 필요 없고, **하나의 파일로 봉인해야 해시로 무결성을 보장**할 수 있다.
- npm은 tar의 메타데이터 보존 능력을 오히려 **지운다.** 타임스탬프·권한·소유자를 고정해 같은 소스가 항상 같은 바이트를 내게 만든다.

40년 된 포맷을 쓰는 게 관성 때문만은 아니다. 필요한 성질이 정확히 맞아떨어진다.

## 참고

- [npm pack — npm Docs](https://docs.npmjs.com/cli/v11/commands/npm-pack)
- [npm registry — package metadata 응답 형식](https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md)
- [node-tar — npm이 쓰는 순수 JS tar 구현](https://github.com/isaacs/node-tar)
- [tar (computing) — Wikipedia](https://en.wikipedia.org/wiki/Tar_(computing))
- [tar(5) 맨페이지 — 포맷 상세](https://man.archlinux.org/man/tar.5.en)
- [Gzip — Wikipedia](https://en.wikipedia.org/wiki/Gzip)
- [The gzip home page](http://www.gzip.org/)
- [RFC 1952 — GZIP file format specification](https://datatracker.ietf.org/doc/html/rfc1952)
- [RFC 1951 — DEFLATE compressed data format](https://datatracker.ietf.org/doc/html/rfc1951)
- [ZIP 포맷 — Wikipedia](https://en.wikipedia.org/wiki/ZIP_(file_format))
- [Normalize timestamps in `npm pack` tarballs — npm/npm#17412](https://github.com/npm/npm/issues/17412)
- [npm v5.6.0 릴리스 노트 — pack 시 mtime 무시](https://blog.npmjs.org/post/167963735925/v560-2017-11-27)
- [Archive metadata — reproducible-builds.org](https://reproducible-builds.org/docs/archives/)
- [HOWTO: Inspect, Download and Extract NPM Packages](https://blog.packagecloud.io/how-to-inspect-download-and-extract-npm-packages/)
