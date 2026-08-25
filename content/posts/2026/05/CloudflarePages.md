---
slug: CloudflarePages
title: "AWS에서 Cloudflare Pages로 Next.js 블로그를 이전한 이유 및 과정"
date: 2026-05-11
tags: ["nextjs", "cloudflare"]
draft: false
---

# AWS에서 Cloudflare Pages로 Next.js 블로그를 이전한 이유 및 과정

* * *

  

## 1.왜 이전했는가? 🤔

AWS S3를 1년동안 무료 버전으로 사용하면서 개인 블로그를 운영해왔었다.

이후 4월달 부터 유료로 비용이 청구되었는데 현재로써 굳이 비용을 사용하면서 까지 이용을 해야할까라는 생각이 들었다.

물론 비용을 청구하면서 공부도 하는 부분은 장점이고 개인적으로 미래를 투자한다는 생각으로 했지만 현재로써는 우선순위로 따지면 높진않기때문에 😛;;;

그래서 알아보던 참에 무료 플랜이 강한 Cloudeflare Page를 알게되었고 개인 프로젝트이기때문에 한번 마이그레이션 해봐야지 라는 결정을 하게되었고 그 과정의 경험을 기록으로 남겨보려고 한다.

  

## 2.왜 Cloudflare Pages를 선택했는가? ☁️

-   비용 이슈
-   대규모 서비스가 아닌 개인 블로그인 점
-   Git Push 기반 자동 배포 ( + 배포 로그 대시보드 )

![](/uploads/2026/05/Deployments.webp)

![](/uploads/2026/05/GitConnect2.webp)  

-   글로벌 CDN 제공
-   Next.js 지원 ( 이슈 있음... Vercel 따라가자... )
-   개인 블로그 수준이기 때문에 AWS 유연성보다 운영적 단순함의 고민
-   환경 변수 세팅 용이

![](/uploads/2026/05/Settings.webp)  

  

  

## 3.어떤 시행착오가 있었나? 👀

### 3-1. next/image를 지원하지 않는 점

> next/image는 단순한 React 컴포넌트가 아니라 "서버 기반 이미지 최적화 기능"인데,
> 
> Cloudflare Pages 환경이 Next.js의 기본 이미지 최적화 서버와 완전히 동일하지 않기 때문  

Next.js에서

```javascript
<Image src="/test.png" width={300} height={200} />
```

를 쓰면 실제로는 :

```javascript
/_next/image?url=...&w=...
```

이런 식으로 최적화 API를 호출해서 Next.js 서버가 아래와 같은 부분을 처리

-   압축
-   이미지 리사이즈
-   webp 변환
-   등...

그런데

Cloudflare Pages는 "정적 호스팅 "기반이고 

Cloudflare Pages에 맞게 next.config.ts에 output: 'export' 로 정적 export 모드로 설정했기 때문에

next export는 HTML, CSS, JS만 생성하기 때문에 Next.js 이미지 최적화 서버는 생성하지 않음

  

대응

> img 태그 사용

\-이유 : 글 이미지 대부분 정적, CDN 캐싱 충분

  

### 3-2.Next.js의 headers() 자동 적용 지원하지 않는 점

> Next.js의 `headers()` 기능은 서버가 응답할 때 HTTP Header를 동적으로 붙이는 기능
> 
> `output: 'export'`를 사용하면 Next.js 서버 자체가 사라짐 그래서 headers 설정도 같이 동작 못함
> 
> export 모드는 next build를 하면 그냥 정적 HTML 파일 생성만 하기 때문에 서버가 없다.
> 
> 그렇기 때문에 header() 실행할 주체가 없다 그렇기때문에 경고를 띄워주는 것이다.

경고 로그 :

```javascript
Specified "headers" will not automatically work with "output: export"
```

  

대응

> Cloudflare는 Next.js headers() 대신 \_headers 파일 을 사용
> 
> 사용 방법 : 
> 
>               1. 프로젝트 public 폴더에`public/_headers`파일 생성.
> 
>               2. /images/\*  
>                   Cache-Control: public, max-age=31536000, immutable
> 
> 이런 식으로 사용 가능.
> 
> 배포 되면 Cloudflare가 이걸 읽어서 헤더 적용

  

## 4.문제점 요약

-   Cloudflare Pages로 이전하면서 가장 먼저 막혔던 부분은 next/image였다.
    
    기존에는 별 문제 없이 사용했지만,
    
    정적 export 기반 배포에서는 Next.js의 이미지 최적화 API가 동작하지 않았다.
    
    결국 블로그 특성상 복잡한 최적화보다 단순한 정적 이미지가 더 적합하다고 판단했고,
    
    최종적으로는 img 태그 기반으로 변경했다.
    
-   AWS 환경에서는 Next.js의 headers() 설정이 정상 동작했지만,
    
    Cloudflare Pages의 static export 환경에서는 더 이상 사용할 수 없었다.
    
    정적 배포에서는 Next.js 서버 자체가 존재하지 않기 때문이다.
    
    결국 Cloudflare 전용 \_headers 파일 방식으로 마이그레이션했다.
    
      
    

### 4-1.궁금한점 : AWS에 배포할때는 잘됬는데..?

> AWS에서는 Next.js 서버가 실제로 살아 있었고
> 
> Cloudflare Pages + output : 'export' 에서는 서버가 사라졌기 때문.
> 
> 그래서
> 
> next/image , headers()
> 
> 둘 다 AWS에서는 잘 동작 했고,
> 
> Cloudflare Pages에서는 제한이 생긴 것임.

  

## 5.정리

> Cloudflare Pages로 이전하면서 가장 크게 달라진 점은 'Next.js 서버가 사라졌다'는 점이었다.
> 
> AWS에서는 자연스럽게 사용하던 next/image와 headers()가 정적 export 환경에서는 더 이상 동일하게 동작하지 않았다.
