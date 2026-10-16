---
slug: graphql-study
title: "Studying GraphQL"
date: 2025-06-10
tags: ["graphql"]
thumbnail: "/uploads/2025/06/graphql-study.png"
draft: false
description: "Why GraphQL exists, why it leans on POST and a single endpoint, and what I ran into applying it to this blog with Apollo Client."
---

# **Studying GraphQL**

* * *

## Background

As an application grows, a modern web front end can use all sorts of advanced approaches to fetch data from the server.

Among them, let's look at GraphQL — a query language for APIs and a server-side runtime that executes queries against a type system you define yourself.

## **Why did it come about?**

The traditional web calls a REST API to fetch data, but that has the drawbacks of **pulling in unnecessary data** along with the query and of **not being able to fetch only the data you need**. Facebook built GraphQL to make up for that.

## **Why is POST usually used?**

-   **Complex query structure**
    -   A GraphQL query is a string, it gets complicated, and it often exceeds the **URL length limit** of GET (roughly 2,000 characters).
-   Includes variables and authentication info
    -   POST can carry query, variables, operationName, and more in the request body, so complex requests stay tidy.
-   Mutations must be POST
    -   Changing data uses a mutation, and since that is an unsafe operation per the HTTP spec, it has to be POST rather than GET.

> GET works too!
> 
> -   Allowed when handling simple queries
> -   Allowed when you need caching
> 
> But for the reasons above, POST is generally preferred

## **Why a single endpoint?**

-   **Query-centric** rather than resource-centric
    -   Because you state which pieces of data you need in a query language, what matters is the query itself, not the API structure
-   **No versioning needed**
    -   REST often carries endpoint versions like /v1/, /v2/,  
        but GraphQL specifies which fields to fetch in the query, so it can extend flexibly without versions  
          
        Ex : )  
        Say there's an API that takes an address and phone number, and later some rule or requirement  
        means it has to take address + phone number + recipient. That has to be managed by version.  
          
        Older applications keep using address + phone number  
        while newer ones can use address + phone number + recipient,  
        so with GraphQL you just add the new field and existing queries keep working.  
        (schema changes are designed to be compatible)
-   Client flexibility
    -   The client can **request only the data it wants**, so one entry point from the server is enough

## An example project applying it

-   I applied a GraphQL + Apollo Client combination to the source of the blog I currently run ( [example project](https://github.com/iamjunghwan/TechBloom) )

## Problems and impressions afterward 🤔

-   I implemented the Apollo server using an api router, but at build time the Apollo server didn't exist yet, so the build failed
-   Getting used to the schema side wasn't easy. ( plenty of errors experienced )
-   Unlike REST, requesting only the data you need really does cut out unnecessary network requests. ( especially on a larger project — if many users are hitting the api the load would be much heavier, and thinking about it that way it seems far more efficient )
-   If there were a separate back end, the fact that I could handle this myself without a back-end developer?
-   Each article has a tag value, and I'm torn about whether to customize the fetch when pulling all article information, or to make a dedicated tag query and fetch it separately
