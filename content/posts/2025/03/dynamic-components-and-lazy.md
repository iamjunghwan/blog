---
slug: dynamic-components-and-lazy
title: "Dynamic Component & Lazy"
date: 2025-03-11
tags: ["react", "javascript"]
draft: false
---

# **Dynamic Component & Lazy**

* * *

필요성

1.페이지 증가에 따른 유지보수 이점

2.불필요한 js 호출 최소화 & 초기 렌더링 성능 최적화

  

사전 작업

1.DB & Front의 메뉴 경로를 매핑

2.node.js 의 `` `glob` `` 객체를 활용한 페이지 경로 접근

( 배포 후 페이지의 접근을 가능하게 해줌 )

  

해결 방법

## #동적 컴포넌트 생성

```javascript
import { lazy, Suspense } from "react";
import { Spin } from "antd";
const componentPages: any = import.meta.glob("../pages/**/**/**.tsx");

const DynamicPathComponent = (props: any) => {
    const LazyComponent = lazy(
        typeof componentPages[props.componentPath] === "function" ? componentPages[props.componentPath] : () => {}
    );
    return (
        <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}>
            <LazyComponent />
        </Suspense>
    );
};

export default DynamicPathComponent;
```

## #Router에 모든 페이지 적용

```javascript
const FncChildrenPathAndElement = (totalMenu) => {
        const childrenMenuArr: ChildrenProps[] = totalMenu
            .map((list) => (list.children !== null ? list.children : []))
            .map((arr) => arr.map((obj) => (obj.menuUrl !== null ? obj.menuUrl : [])))
            .filter((val, idx) => val.length > 0)
            .join()
            .split(",")
            .map((path) => {
                return {
                    path: path.split("..")[1].split(".tsx")[0], 
                    element: <DynamicPathComponent componentPath={path} />,
                    errorElement: <ElementComponentError />
                };
            });
        return childrenMenuArr;
    };

  const dynamicMenuPages = [
            {
                path: "/login", 
                element: <LoginLayout />,
                children: [{ index: true, element: <Login />, errorElement: <ElementComponentError /> }],
                errorElement: <Error />
            },
            {
                path: "/",
                element: <MainLayout _Menu={totalMenuList} />,
                children: defaltMainMenu.concat(...childrenMenuList),
                errorElement: <Error />
            },
        ];

        setDynamicPage(createBrowserRouter([...dynamicMenuPages]));

(이하 소스 생략)
...

 return <>{isLoading && <RouterProvider router={dynamicPage} />}</>;
```
