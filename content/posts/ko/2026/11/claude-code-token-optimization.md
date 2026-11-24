---
slug: claude-code-token-optimization
title: "Claude Code 토큰을 아껴 쓰는 법"
date: 2026-11-24
tags: ["ai"]
thumbnail: "/uploads/2026/11/claude-code-token-optimization.png"
draft: false
---

# Claude Code 토큰을 아껴 쓰는 법

---

이 블로그는 처음에는 `CLAUDE.md` 하나였다. 지금은 skill 3개, 서브에이전트 3개, hook 3개가 붙어 있다.

하나씩 붙일 때마다 일은 편해졌다. 동시에 궁금해졌다. 이것들이 매 요청마다 얼마나 실려 가고 있을까. Team 요금제 사용량 화면에는 "현재 세션(5시간)"과 "주간 한도"가 따로 있다. 둘 다 언젠가는 바닥난다.

아직 전후 숫자를 재 보지는 않았다. 대신 공부한 내용을 공식 문서로 하나씩 확인했다. 이 글은 **토큰을 줄이는 방법마다 왜 줄어드는지를 공식 문서로 짚고, 이 블로그 저장소의 실제 설정을 사례로 붙인다.**

내용은 2026-11-23에 확인한 Claude Code 문서 기준이다. 버전·모델·가격은 계속 바뀐다.

## 1. 프론트엔드 최적화와 같은 문제다

공식 문서에 따르면 Claude Code는 요청마다 전체 컨텍스트를 다시 보낸다. 시스템 프롬프트와 도구 정의, `CLAUDE.md` 같은 프로젝트 컨텍스트, 그리고 지금까지의 대화다. 캐시가 없다면 API는 매 턴 전체 기록을 다시 처리한다.

```text
요청 1: [시스템 프롬프트 + 도구] [CLAUDE.md·메모리·rules] [대화 1]
요청 2: [시스템 프롬프트 + 도구] [CLAUDE.md·메모리·rules] [대화 1, 2]
요청 3: [시스템 프롬프트 + 도구] [CLAUDE.md·메모리·rules] [대화 1, 2, 3]
```

이 구조를 보면 프론트엔드의 번들 최적화가 떠오른다. 첫 화면에 실리는 것을 줄이고, 필요할 때 불러오고, 한 번 받은 것은 다시 쓴다. 토큰 절약도 같은 다섯 가지로 묶인다고 본다.

| 개념                    | 프론트엔드 비유           | Claude Code 기능      | 이 저장소                    |
| ----------------------- | ------------------------- | --------------------- | ---------------------------- |
| 줄이기(Reduction)       | 번들 크기 줄이기          | 짧은 `CLAUDE.md`      | 루트 `CLAUDE.md` 3,735바이트 |
| 격리(Isolation)         | 관심사 분리               | 서브에이전트          | researcher·writer·reviewer   |
| 지연 로딩(Lazy Loading) | 코드 스플리팅·lazy import | skills, MCP 도구 검색 | 절차는 skill로 뺐다          |
| 압축(Compression)       | 압축 전송                 | `/compact`, 자동 압축 | —                            |
| 재사용(Reuse)           | HTTP 캐시                 | 프롬프트 캐싱         | 자동                         |

비유는 내 해석이다. 공식 문서가 이렇게 분류하지는 않는다. 다만 이 표를 머리에 두면 뒤의 방법들이 어디에 속하는지 정리가 쉽다.

## 2. 무엇부터 할까

공식 비용 문서(costs)에는 관리자용 절이 있다. 그중 API·클라우드 요금제에서 지출이 예상보다 클 때 살펴볼 항목에서, 영향이 가장 큰 습관으로 두 가지를 든다. 관련 없는 작업 사이에 `/clear`로 비우는 것, 그리고 작업에 맞는 모델을 고르는 것이다(원문: "clearing between unrelated tasks and matching the model to the job"). 일반 사용자용 목록은 아니지만 구독에서도 같은 원리라고 본다.

나머지 순서는 공식 순위가 없다. 아래 표의 효과와 난이도는 **내 판단이다.**

| 방법                         | 기대 효과    | 난이도      | 절  |
| ---------------------------- | ------------ | ----------- | --- |
| 작업 단위로 세션 나누기      | 매우 높음    | 낮음        | 3   |
| 작업에 맞는 모델·effort      | 높음         | 낮음        | 6   |
| `CLAUDE.md` 줄이기           | 높음         | 낮음        | 4   |
| 작업 범위를 좁혀 말하기      | 높음         | 낮음        | 10  |
| skills·rules로 지침 나누기   | 높음         | 보통        | 4   |
| MCP 컨텍스트 관리            | 높음         | 낮음        | 4   |
| 서브에이전트로 탐색 맡기기   | 높음         | 보통        | 5   |
| 압축을 끊김에서 하기         | 보통         | 낮음        | 8   |
| hooks로 확인을 코드에 맡기기 | 보통         | 보통        | 7   |
| 캐시를 깨지 않는 습관        | 비용 절감 큼 | 대부분 자동 | 9   |

## 3. 세션을 작업 단위로 나눈다

costs 문서는 관련 없는 작업으로 넘어갈 때 `/clear`를 쓰라고 한다. 이유는 한 문장이다.

> "Stale context wastes tokens on every subsequent message."

1절의 그림대로라면 당연하다. 앞 작업의 대화가 남아 있으면 이후 모든 요청에 같이 실린다. 같은 문서에 따르면 긴 세션에서는 한 줄짜리 질문도 쌓인 대화 전체만큼 사용량이 든다. 캐시 가격으로 계산되긴 하지만 매번 든다. `/clear` 자체는 비용이 들지 않는다.

돌아올 작업이라면 지우기 전에 `/rename`으로 이름을 붙여 두고 나중에 `/resume`으로 연다. 공식 문서가 함께 권하는 방법이다.

이 저장소에서는 `SessionStart` hook이 새 세션을 돕는다. Claude Code를 새로 실행하면 draft 글과 영어판이 없는 글을 알려 준다. 앞 세션의 대화를 끌고 오지 않아도 할 일을 알 수 있다. 다만 matcher가 `startup`이라 `/clear` 뒤에는 돌지 않는다. hooks 문서상 `/clear` 뒤의 SessionStart는 source가 `clear`이기 때문이다.

## 4. 시작할 때 실리는 것을 줄인다

### CLAUDE.md는 매 세션 실린다

memory 문서에 따르면 `CLAUDE.md`는 매 세션 시작 때 로드된다. 공식 권장은 파일당 200줄 이하다.

> "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."

`@path` import는 크기를 줄여 주지 않는다. 문서는 import가 긴 파일을 정리하는 데는 도움이 되지만, import한 파일도 함께 로드되므로 컨텍스트 비용은 그대로라고 밝힌다.

이 저장소의 루트 `CLAUDE.md`는 69줄, 3,735바이트로 권장 안쪽이다. 여기에 `@AGENTS.md`(688바이트)를 import한다. 둘 다 매 세션 실린다. 그래서 `CLAUDE.md`에는 아키텍처 요약, 글 위치와 문체 규칙, 작업 방식만 짧게 둔다. 작업 기록에 남긴 판단은 이랬다.

> "CLAUDE.md는 매 세션 읽히므로 짧게 두고, 작업별 세부 절차는 필요할 때만 로드되는 skill로 뺐다."

### skills는 설명만 먼저 들어간다

skills 문서에 따르면 세션에는 각 skill의 이름과 설명만 들어간다. 본문은 호출될 때 로드된다.

> "a skill's body loads only when it's used, so long reference material costs almost nothing until you need it."

공짜는 아니다. skill 목록은 쓰든 안 쓰든 매 턴 컨텍스트에 들어간다. 설명(`description`과 `when_to_use`)은 합쳐 1,536자에서 잘린다. 설명을 짧고 정확하게 쓰는 것도 절약이다.

`disable-model-invocation: true`를 주면 설명조차 컨텍스트에 들어가지 않는다. 사용자가 직접 부를 때만 본문이 로드된다. 보조 파일은 `SKILL.md`가 가리킬 때 필요한 시점에 읽힌다.

이 저장소의 skill은 이렇다.

| skill          | 크기                                         | 로드                |
| -------------- | -------------------------------------------- | ------------------- |
| write-post     | 4.3KB (+ style.md 1.5KB, thumbnail.md 2.6KB) | 요청이 맞으면 자동  |
| translate-post | 2.1KB                                        | 자동                |
| publish-post   | 2.1KB                                        | `/publish-post`로만 |

publish-post는 글을 공개하는 skill이다. 모델이 알아서 부르면 안 되는 일이라 `disable-model-invocation: true`를 줬다. 덕분에 목록 비용도 없다. write-post의 문체·썸네일 문서는 그 단계에 갔을 때만 읽는다.

### rules는 paths:가 있을 때만 줄인다

`.claude/rules/`는 공식 기능이다. 다만 rules로 옮긴다고 무조건 줄지는 않는다. memory 문서에 따르면 `paths:` frontmatter가 없는 rules는 `CLAUDE.md`처럼 세션 시작에 로드된다. `paths:`를 주면 해당 경로의 파일을 다룰 때만 로드된다.

> "Rules can also be scoped to specific file paths, so they only load into context when Claude works with matching files, reducing noise and saving context space."

이 저장소는 아직 rules를 쓰지 않는다. 특정 폴더에만 필요한 규칙이 생기면 경로를 걸어 rules로 빼는 게 맞다고 본다.

### MCP 도구는 기본이 지연 로드다

mcp 문서에 따르면 도구 검색(tool search)이 기본으로 켜져 있다. 세션 시작에는 도구 이름과 서버 안내만 들어가고, 도구 정의는 필요할 때 불러온다. 일부 옛 모델과 일부 클라우드 배포에서는 모든 도구를 미리 로드한다는 예외가 있다.

costs 문서는 `gh`·`aws` 같은 CLI가 MCP보다 효율적인 경우가 많다고 하고, 안 쓰는 서버는 `/mcp`에서 끄라고 권한다. 이 저장소는 프로젝트 MCP 설정(`.mcp.json`)을 두지 않았다.

### 자동 메모리도 시작에 실린다

자동 메모리를 켠 세션에서는 `MEMORY.md`의 처음 200줄 또는 25KB(먼저 닿는 쪽)가 세션 시작에 로드된다. 그 뒤는 시작 시 로드되지 않는다. 메모리를 짧게 유지해야 하는 이유다. memory 문서도 `MEMORY.md`가 한도에 가까워지면 오래된 항목을 합치거나 지우라고("merge or drop stale entries") 알려 준다고 설명한다.

## 5. 탐색과 검증은 서브에이전트에 맡긴다

sub-agents 문서에 따르면 서브에이전트는 자기 컨텍스트 창에서 돈다. 메인 대화에는 요약만 돌아온다.

> "the verbose output stays in the subagent's context while only the relevant summary returns to your main conversation."

**서브에이전트는 메인 컨텍스트를 아끼지만 총 토큰을 줄이지는 않는다.** 같은 문서는 서브에이전트도 자기 요청을 보내고, 그 요청이 메인 대화와 같은 사용 한도에 잡힌다고 밝힌다. 새 컨텍스트로 시작하므로 메인이 이미 읽은 파일이나 대화를 보지 못한다. prompt-caching 문서에 따르면 첫 요청은 부모의 캐시도 읽지 못한다. 그래서 총량은 늘 수 있다. 정량 비교는 공식 자료에 없다.

이 저장소는 글 작업에 서브에이전트 셋을 둔다.

| agent              | model  | 하는 일                        |
| ------------------ | ------ | ------------------------------ |
| researcher         | sonnet | 외부 자료 조사 → `research.md` |
| article-writer     | opus   | 새 글 초안·구조 재작성         |
| technical-reviewer | opus   | 기술 주장 검증                 |

총량이 늘 수 있으니 부르는 조건을 정해 뒀다. 오탈자나 문장 손질에는 셋 다 부르지 않는다. 출처가 담긴 초안에는 reviewer만 부른다.

자료는 프롬프트에 붙이지 않고 파일 경로로 넘긴다. 조사 결과는 `.local/posts/<slug>/research.md`에 쓰고, 다음 에이전트는 그 파일을 읽는다. 요약이 메인으로 돌아온다는 것까지는 공식 문서로 확인했다. 결과를 파일로 쓰고 경로만 주고받는 방식은 공식 권장으로 확인하지 못했다. 내 운영 방식이다.

## 6. 작업에 맞는 모델과 effort

### 모델은 Sonnet 기본, 어려우면 Opus

costs 문서의 권장은 분명하다.

> "Sonnet handles most coding tasks well and costs less than Opus. Reserve Opus for complex architectural decisions or multi-step reasoning."

단순한 서브에이전트 작업에는 `model: haiku`를 지정하라고 한다. 또 세션을 Opus로 바꾸면 모델을 상속하는 서브에이전트도 Opus로 돈다. 서브에이전트에 `model:`을 적어 두는 이유다.

API 가격은 이렇다(2026-11-23, USD / 100만 토큰). Claude Code의 `opus`·`sonnet`·`haiku` 별칭은 Anthropic API에서 각각 5.5 버전으로 해석된다.

| 모델                                | 입력 | 출력 | 캐시 읽기 | 5분 캐시 쓰기 | 1시간 캐시 쓰기 |
| ----------------------------------- | ---- | ---- | --------- | ------------- | --------------- |
| Fable 5.2                           | 8    | 40   | 0.20      | 10            | 16              |
| Opus 5.5                            | 4    | 20   | 0.20      | 5             | 8               |
| Sonnet 5.5                          | 2    | 10   | 0.10      | 2.50          | 4               |
| Haiku 5.5 (프롬프트 100k 토큰 이하) | 0.10 | 0.50 | 0.01      | 0.125         | 0.20            |
| Haiku 5.5 (100k 초과)               | 0.50 | 2.50 | 0.05      | 0.625         | 1               |

API 가격으로는 Sonnet 5.5가 Opus 5.5의 절반이다. 구독은 사정이 다르다. 가격 비율이 곧 구독 한도 소모 비율이라는 공식 설명은 찾지 못했다. 지원 문서는 "Opus costs several times more per turn than Sonnet, and Sonnet more than Haiku"라고만 한다.

한도 메시지도 구분해야 한다. costs 문서에 따르면 세션·주간 한도는 모든 모델에 걸친 한도라 `/model`로 바꿔도 풀리지 않는다. "Opus limit"처럼 모델별 메시지가 뜨면 다른 계열로 바꿔 계속 쓸 수 있다. 내 사용량 화면의 "모든 모델 / Fable" 구분을 설명하는 공식 문서는 찾지 못했다.

이 저장소에서는 조사(researcher)를 Sonnet에 맡긴다. 웹을 찾아 출처를 모으는 일이다. 초안과 기술 검증은 Opus에 둔다.

공식 문서는 Haiku의 쓰임을 "단순한 작업"으로만 적는다. model-config는 "simple tasks", costs는 단순한 서브에이전트 작업이다. 작업별 세부 분류는 공식 문서에 없다.

### effort는 작업마다 낮춘다

`/effort`로 사고량을 정한다. model-config 문서는 이렇게 설명한다.

> "Each level trades token spend against capability."

같은 문서의 다른 문단은 단순한 작업에는 낮은 effort가 더 빠르고 싸다고 설명한다.

5.5 계열과 Fable은 `low`·`medium`·`high`·`xhigh`·`max`를 쓴다. 기본값은 모델마다 다르다. Fable 5.2와 5.5 계열은 `medium`이고, 다른 모델은 대부분 `high`다. 문서에 따르면 `max`는 올린 만큼 효과가 줄고 지나치게 생각하기 쉽다("diminishing returns and is prone to overthinking"). thinking 토큰은 출력 토큰으로 과금된다. 다만 Opus 5.5·Sonnet 5.5·Haiku 5.5·Fable은 thinking을 끌 수 없다.

### 고르는 시점은 세션 처음

모델을 바꾸면 캐시가 깨진다. 모델마다 캐시가 따로라서, `/model`로 바꾼 다음 요청은 전체 대화를 캐시 없이 읽는다. effort 변경도 대부분 모델에서 캐시를 깬다. 다만 prompt-caching 문서에 따르면 Fable 5.1 이상과 5.5 계열은 API 키·구독에서 캐시가 유지된다.

> "Pick your model and effort level at the top of a session, then save `/compact` for natural breaks between tasks."

## 7. hooks: 확인은 코드에, 출력은 실패할 때만

hook 출력이 모두 컨텍스트에 들어가지는 않는다. hooks 문서에서 확인한 규칙은 이렇다.

| 경로                                                | Claude가 보나                    |
| --------------------------------------------------- | -------------------------------- |
| `SessionStart`·`UserPromptSubmit`의 stdout (exit 0) | 본다. 컨텍스트에 추가된다        |
| exit 0일 때의 stderr                                | 안 본다                          |
| `PostToolUse`의 exit 2 stderr                       | 본다 (도구는 이미 실행됨)        |
| `PreToolUse`의 exit 2 stderr                        | 본다. 호출이 막힌다              |
| `additionalContext`                                 | 본다. system-reminder로 들어간다 |

출력 하나당 상한은 10,000자다. 넘으면 파일로 저장하고 경로와 앞 2,000자만 넣는다.

여기서 설계 원칙이 나온다. **성공하면 조용히, 실패할 때만 짧게.** 공식 문장은 아니지만 위 규칙과 맞는다. 이 저장소의 hook 셋은 모두 이렇게 짰다.

| 이벤트                   | 스크립트           | 하는 일                                               | 컨텍스트에 들어가는 때           |
| ------------------------ | ------------------ | ----------------------------------------------------- | -------------------------------- |
| PreToolUse(Bash)         | guard-bash.mjs     | slug 없는 `pnpm thumbnail`, main 밖 `pnpm fonts` 차단 | 막을 때만 (exit 2 stderr)        |
| PostToolUse(Edit\|Write) | check-post.ts      | 고친 글 하나만 검사: frontmatter, 깨진 `**`, ko·en 짝 | 문제가 있을 때만 (exit 2 stderr) |
| SessionStart(startup)    | session-status.mjs | draft 글·영어판 없는 글 알림                          | 할 일이 있을 때만 (stdout)       |

`SessionStart` 출력은 세션마다 대화 앞에 들어가 이후 요청에 계속 실린다. 출력이 없으면 비용도 없다. `PostToolUse` 출력은 세션마다 고정이 아니라 생길 때마다 쌓인다.

2026-11-23에는 굵은 글씨 깨짐 검사를 넣었다. Sonnet 에이전트에게 맡기는 안도 있었지만 hook과 `pnpm test`로 넣었다. 문법 문제라 코드로 다 잡히고, 모델 호출이 없다. 문제가 없으면 한 글자도 컨텍스트에 들어가지 않는다.

costs 문서도 비슷한 예를 든다. 10,000줄 로그에서 ERROR 줄만 걸러 넘기면 수만 토큰이 수백 토큰으로 준다는 것이다. 측정치가 아니라 예시 설명이다.

## 8. 압축은 끊김에서, 지시와 함께

컨텍스트가 한도에 가까워지면 자동 압축이 돈다. 압축은 대화를 요약으로 바꾸므로 세부가 사라지는 것은 구조상 당연하다. hook이 앞서 넣은 내용도 함께 요약된다.

직접 `/compact`를 하면 남길 것을 정할 수 있다.

```text
/compact Focus on code samples and API usage
```

공식 문서는 이렇게 설명한다. "The summary keeps what you choose instead of what the automatic pass guesses is important." `CLAUDE.md`에 `# Compact instructions` 절을 두는 방법도 있다.

공식 문서가 자동 압축이 나쁘다고 말하지는 않는다. 기본 동작으로 소개한다. 권장은 두 가지다. 작업 사이 자연스러운 끊김에서 `/compact`, 관련 없는 작업이면 `/clear`.

압축도 요청이다. costs 문서에 따르면 큰 컨텍스트를 압축하는 것 자체가 큰 요청이다. prompt-caching 문서에 따르면 캐시가 살아 있으면 저렴하지만, 캐시 TTL이 지난 오래된 세션을 다시 열어 압축하면 가장 비싸다.

압축 뒤에 남는 것도 정해져 있다(context-window 문서).

| 항목                          | 압축 뒤                                           |
| ----------------------------- | ------------------------------------------------- |
| 루트 `CLAUDE.md`, 자동 메모리 | 디스크에서 다시 주입                              |
| 최근 읽은 파일                | 최대 5개 다시 읽음 (5,000토큰 넘는 파일은 경로만) |
| 호출한 skill 본문             | skill당 5,000토큰, 합계 25,000토큰까지 다시 주입  |
| hook이 넣은 내용              | 요약됨                                            |

## 9. 캐시를 깨지 않는 습관

prompt-caching 문서에 따르면 Claude Code는 캐싱을 알아서 처리한다. API는 요청 앞부분(prefix)이 정확히 같으면 캐시에서 읽는다. 중간이 바뀌면 그 뒤는 전부 다시 계산한다. 캐시 읽기는 입력 가격의 일부만 든다(Opus 5.5·Sonnet 5.5는 0.05배).

그래서 직접 할 일은 하나다. 캐시를 깨는 행동을 세션 중간에 하지 않는 것이다.

| 캐시를 깬다                                | 캐시를 유지한다                |
| ------------------------------------------ | ------------------------------ |
| `/model`로 모델 전환                       | 저장소 파일 편집               |
| effort 변경 (대부분 모델)                  | 세션 중 `CLAUDE.md` 편집       |
| fast mode 켜기                             | 권한 모드 변경, plan mode 전환 |
| MCP 서버 연결·제거 (지연 로드가 꺼진 경우) | 출력 스타일 변경               |
| 압축                                       | skill·command 호출             |
| 이미지 누적                                | `/rewind`, 서브에이전트 생성   |
| Claude Code 업그레이드                     |                                |

`CLAUDE.md`를 세션 중에 고쳐도 캐시는 깨지지 않는다. 문서에 따르면 세션 시작 때 읽어 메모리에 들고 있기 때문이다.

> "When you edit your project-root or user-level CLAUDE.md mid-session, the cached prefix stays intact."

대신 고친 내용은 `/clear`·`/compact`·재시작 전에는 반영되지 않는다. 고쳤는데 안 먹는다면 이 때문이다.

캐시 수명(TTL)도 있다. Claude 구독의 포함 사용량 안에서는 메인 대화가 1시간이다. API 키·사용 크레딧·클라우드와, 서브에이전트·압축 같은 나머지 요청은 기본 5분이다. 휴식이 TTL보다 길면 다음 메시지가 전체 컨텍스트를 다시 처리한다.

이미지도 조심한다. vision 문서의 식은 `⌈가로 / 28⌉ × ⌈세로 / 28⌉`이다. 28×28 픽셀마다 토큰 하나다.

| 이미지    | 표준 (긴 변 1,568px까지) | 고해상도 (Claude 4.7 이후) |
| --------- | ------------------------ | -------------------------- |
| 1000×1000 | 1,296                    | 1,296                      |
| 1920×1080 | 1,560                    | 2,691                      |
| 3840×2160 | 1,560                    | 4,784                      |

큰 스크린샷은 최신 모델에서 수천 토큰이 될 수 있다. 작은 이미지는 수백 토큰이다. API 문서 기준이고, Claude Code 안에서 같은 식으로 계산되는지는 확인하지 못했다. 이미지가 많이 쌓이면 오래된 것부터 빠지면서 캐시가 깨진다.

## 10. 범위를 좁혀 말하고, 방향을 먼저 맞춘다

costs 문서는 구체적인 프롬프트를 권한다. 모호한 요청은 넓은 탐색을 부르고, 탐색은 파일 읽기로 토큰을 쓴다.

복잡한 작업은 plan mode(Shift+Tab)로 시작한다.

> "Claude explores the codebase and proposes an approach for your approval, preventing expensive re-work when the initial direction is wrong."

방향이 틀렸다 싶으면 일찍 Esc로 멈추고 `/rewind`로 되돌린다. plan mode 전환은 캐시를 깨지 않는다. 다만 `opusplan` 설정은 모델 전환이라 깬다.

## 11. 적용 전후는 이렇게 잰다

아직 전후 비교는 없다. 시작 상태와 최근 사용량만 재 봤다(아래). 잴 때는 공식 도구를 쓴다.

| 무엇을                                | 어떻게                                         |
| ------------------------------------- | ---------------------------------------------- |
| 지금 컨텍스트 사용량, 카테고리별 비중 | `/context`                                     |
| 로드된 `CLAUDE.md`·메모리 파일        | `/context`, `/memory`                          |
| 세션 누적 토큰·추정 비용              | `/usage`의 세션 블록 (`/clear`에서 0으로 리셋) |
| 캐시 적중                             | `/usage`의 `Prompt cache (main)` 줄            |
| skill·서브에이전트·MCP별 비중         | `/usage` (구독 플랜)                           |
| 계속 보기                             | 상태 표시줄(statusline)                        |

`/usage`의 일부 항목은 버전에 따라 다르다. `Prompt cache (main)` 줄은 v2.1.251 이상, 추천 항목을 `f` 키로 적용하는 기능은 v2.1.305 이상이다. 내 환경은 v2.1.318이라 둘 다 해당한다. 작업 시간이나 재작업 횟수는 공식 지표가 아니다. 재고 싶으면 따로 적어야 한다.

비교는 같은 작업으로 한다.

```text
1. 새 세션을 연다 → 아무것도 하지 않고 /context
2. 같은 종류의 작업(예: 글 한 편 초안)을 한다
3. 끝나면 /usage로 세션 토큰과 캐시 줄을 적는다
4. 설정을 바꾸고 1~3을 반복한다
```

### 새 세션의 시작 상태

블로그 저장소에서 새 세션을 열고, 아무것도 입력하지 않은 채 `/context`를 실행했다. 모델은 Opus 5.5(컨텍스트 100만 토큰)다.

| 카테고리                | 토큰  | 무엇이 들어가나                       |
| ----------------------- | ----- | ------------------------------------- |
| System prompt           | 3.9k  | Claude Code 기본 프롬프트             |
| System tools            | 24.2k | 내장 도구 정의                        |
| MCP tools               | 605   | 연결된 MCP 도구 (지연 로드)           |
| MCP server instructions | 1.7k  | MCP 서버 안내                         |
| Custom agents           | 387   | researcher 등 에이전트 설명           |
| Memory files            | 2.2k  | `CLAUDE.md`, `AGENTS.md`, `MEMORY.md` |
| Skills                  | 5.7k  | skill 이름·설명 목록                  |
| Messages                | 1.4k  | 입력 전부터 있던 메시지               |
| **합계 (화면 표시)**    | 39.9k | 100만 토큰의 4%                       |
| Autocompact buffer      | 33.0k | 자동 압축용으로 비워 둔 공간          |

표의 줄을 직접 더하면 40.1k다. 반올림 차이다.

아무것도 하지 않았는데 39.9k가 실린다. 이후 모든 요청의 바닥이 이만큼이다.

- 가장 큰 것은 내장 도구(24.2k)다. 내가 설정으로 건드린 영역이 아니다.
- 4절에서 다룬 영역(Memory files, Skills, Custom agents, MCP 두 줄)은 합쳐 약 10.6k다.
- Skills가 5.7k로 생각보다 크다. 이 저장소에서 만든 skill은 셋이고, 그중 publish-post는 목록에서 빠진다. 나머지는 설치한 플러그인과 내장 skill의 설명이다. 줄일 곳은 내 skill보다 플러그인 쪽이다.
- Messages 1.4k는 입력 전이므로 `SessionStart` hook이 넣은 내용으로 보인다. 이 저장소의 draft 알림과 플러그인의 안내가 여기에 해당한다.
- Autocompact buffer는 실제로 실린 양이 아니라 비워 둔 공간이다. 39.9k + 33.0k + 남은 927.1k가 100만이다.

### 최근 24시간 사용량

`/usage`에는 무엇이 한도를 쓰고 있는지 추천 항목과 함께 보여 주는 칸이 있다. 이 기기의 세션만, 최근 24시간 기준이고, 항목끼리 겹친다.

| 추천 항목                                                        | 비중 | 관련 절 |
| ---------------------------------------------------------------- | ---- | ------- |
| 서브에이전트가 어떤 모델을 쓰는지 확인하라                       | 86%  | 5·6절   |
| 여러 시간 이어진 세션을 점검하라 (요청이 8개 이상의 시간대에 걸친 세션) | 86%  | 3절     |
| 작업을 바꿀 때 새로 시작하라 (`/clear`)                          | 56%  | 3절     |
| 컨텍스트를 채우는 것을 보라 (`/context`)                         | 24%  | 11절    |
| 자리를 비우기 전에 압축하라 (`/compact`)                         | 10%  | 8절     |

비중은 그 줄의 조건에 해당하는 사용량이다. 첫 두 줄은 세션 단위로 센다. 첫 줄에는 "share covers whole sessions, not only subagents"라고 적혀 있다.

눈에 띄는 것은 두 번째 줄이다. 사용량의 86%가 서로 다른 8개 이상의 시간대에 요청이 걸친 세션에서 나왔다. 이 글을 쓴 세션이 그랬다. 다른 글 수정부터 이 글 초안까지 한 세션에서 이어 했다. 3절에 쓴 것을 나부터 지키지 않고 있었다.

skill별 비중은 translate-post 7%, write-post 5%, code-review 1%였다.

추천 목록 아래에는 "Fix 1 of 5" 버튼이 있다(VS Code 확장 화면 기준, 터미널에서는 `f to fix 1 of 5` 힌트로 나온다). 다섯 줄 가운데 한 줄을 Claude Code가 처리해 준다는 뜻이다. costs 문서에 따르면 줄 모양에 따라 하는 일이 다르다.

| 줄 모양                 | `f`를 누르면                                                   |
| ----------------------- | -------------------------------------------------------------- |
| `/effort` 명령으로 끝남 | Claude Code가 그 명령을 실행한다                               |
| `run /clear`처럼 끝남   | 아무것도 하지 않는다. 직접 실행해야 한다                       |
| 그 밖                   | 일부 줄은 Claude에게 단계로 넘어가고, 나머지는 넘어가지 않는다 |

Claude에게는 프롬프트 하나가 간다. 문서에 따르면 그 프롬프트는 바꿀 내용을 바꾸기 전에 먼저 보여 달라고 요청한다. 내 화면에서는 `run`으로 끝나는 세 줄은 대상이 아니고, 남은 두 줄 가운데 하나가 처리 대상이었다. 비중은 "그 줄이 해당하는 사용량"이지 고치면 아끼는 양이 아니라는 점도 문서에 적혀 있다.

## 정리

방법은 많지만 따지는 기준은 몇 개뿐이라고 본다.

- 이건 **매 요청에 실리나, 필요할 때만 실리나.** 매번 실린다면 정말 매번 필요한가.
- 이 작업은 앞 대화가 필요한가. 아니면 `/clear`가 가장 싼 최적화다.
- 이 일은 모델이 판단해야 하나. 규칙으로 판정되는 일이라면 hook과 테스트가 더 싸다.
- 서브에이전트로 메인을 비우는 값어치가 총 토큰이 느는 값보다 큰가.
- 지금 하려는 변경이 캐시를 깨나. 깬다면 세션 처음이나 작업 사이로 미룰 수 있나.

이 블로그 설정은 이 기준으로 만들었다. 시작 상태와 사용량은 재 봤지만, 설정을 바꾼 전후 비교는 아직이다. 사용량의 86%가 긴 세션에서 나왔으니, 세션을 작업 단위로 끊는 것부터 해 볼 생각이다.

## 참고

- [Manage costs effectively](https://code.claude.com/docs/en/costs) — 공식 비용 관리·토큰 절약 권장 목록
- [How Claude remembers your project](https://code.claude.com/docs/en/memory) — `CLAUDE.md` 로드 시점, 200줄 권장, import, rules, 자동 메모리
- [Extend Claude with skills](https://code.claude.com/docs/en/skills) — skill 로드 방식, `disable-model-invocation`
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents) — 별도 컨텍스트, `model` 필드
- [Hooks reference](https://code.claude.com/docs/en/hooks) — hook 출력이 컨텍스트에 들어가는 규칙, 10,000자 상한
- [Explore the context window](https://code.claude.com/docs/en/context-window) — 시작 시 로드 항목, 압축 뒤 남는 것, `/context`
- [How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching) — 캐시를 깨는·유지하는 행동, TTL
- [Claude Code 문서: model-config](https://code.claude.com/docs/en/model-config) — 모델 별칭, effort 레벨과 기본값
- [Claude Code 문서: MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search) — MCP 도구 검색과 지연 로드
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) — 모델별 가격, 캐시 배수
- [Vision](https://platform.claude.com/docs/en/build-with-claude/vision#evaluate-image-size) — 이미지 토큰 계산식
- [Models & usage limits in Claude Code](https://support.claude.com/en/articles/14552983-models-usage-limits-in-claude-code) — Opus가 Sonnet보다 한도를 더 쓴다는 지원 문서
