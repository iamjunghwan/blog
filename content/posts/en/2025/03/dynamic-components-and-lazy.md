---
slug: dynamic-components-and-lazy
title: "Dynamic Component & Lazy"
date: 2025-03-11
tags: ["react", "javascript"]
thumbnail: "/uploads/2025/03/dynamic-components-and-lazy.png"
draft: false
description: "Mapping menu paths from the DB to page files with glob, then loading each route's component through lazy and Suspense so the router builds itself."
---

# **Dynamic Component & Lazy**

* * *

Why it's needed

1\. Easier maintenance as the number of pages grows

2\. Fewer unnecessary js calls & better initial render performance

  

Groundwork

1\. Map the menu paths in the DB to those on the front end

2\. Reach the page paths using node.js's `` `glob` `` object

( this is what makes the pages reachable after deployment )

  

The approach

## #Creating the dynamic component

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

## #Applying every page to the Router

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

(rest of the source omitted)
...

 return <>{isLoading && <RouterProvider router={dynamicPage} />}</>;
```
