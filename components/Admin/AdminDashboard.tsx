"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import InnerHeader from "@/components/Layout/InnerHeader";
import StatTables from "@/components/Admin/StatTables";
import {
  DEFAULT_PERIOD,
  OAUTH_CLIENT_ID,
  OAUTH_SCOPE,
  PERIODS,
  type Period,
} from "@/app/lib/analytics/config";
import { Ga4Error, fetchStats, type Ga4Stats } from "@/app/lib/analytics/ga4";
import { articleViews, type ArticleRef } from "@/app/lib/analytics/articles";

/** Google Identity Services 중 쓰는 부분만 타입을 적는다. */
type TokenResponse = { access_token?: string; error?: string };
type TokenClient = { requestAccessToken: () => void };
type TokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: { initTokenClient: (config: TokenClientConfig) => TokenClient };
      };
    };
  }
}

type View =
  | { kind: "signedOut"; message?: string }
  | { kind: "loading" }
  | { kind: "ready"; stats: Ga4Stats }
  | { kind: "error"; message: string };

function messageFor(error: unknown): string {
  if (error instanceof Ga4Error && error.status === 403) {
    return "이 계정은 GA4 속성 권한이 없습니다.";
  }
  if (error instanceof Ga4Error) {
    return `통계를 불러오지 못했습니다 (HTTP ${error.status}).`;
  }
  return "통계를 불러오지 못했습니다. 네트워크를 확인해 주세요.";
}

const tabClass = (active: boolean) =>
  `rounded-full px-3 py-1 text-sm border ${
    active
      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
      : "border-gray-300 dark:border-gray-700"
  }`;

export default function AdminDashboard({ articles }: { articles: ArticleRef[] }) {
  const [gisReady, setGisReady] = useState(false);
  // 토큰은 메모리에만 둔다. 새로고침하면 다시 로그인한다.
  const [token, setToken] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [view, setView] = useState<View>({ kind: "signedOut" });
  const [attempt, setAttempt] = useState(0);

  const signIn = useCallback(() => {
    const oauth2 = window.google?.accounts.oauth2;

    if (!oauth2) {
      return;
    }
    oauth2
      .initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: OAUTH_SCOPE,
        callback: (response) => {
          if (response.access_token) {
            setToken(response.access_token);
          } else {
            setView({ kind: "signedOut", message: "로그인하지 못했습니다." });
          }
        },
        error_callback: (error) => {
          const message =
            error.type === "popup_failed_to_open"
              ? "로그인 창이 열리지 않았습니다. 팝업 차단을 확인해 주세요."
              : error.type === "popup_closed"
                ? "로그인 창이 닫혔습니다."
                : "로그인하지 못했습니다.";
          setView({ kind: "signedOut", message });
        },
      })
      .requestAccessToken();
  }, []);

  useEffect(() => {
    if (token === null) {
      return;
    }
    let cancelled = false;

    setView({ kind: "loading" });
    fetchStats(token, period)
      .then((stats) => {
        if (!cancelled) {
          setView({ kind: "ready", stats });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof Ga4Error && error.status === 401) {
          setToken(null);
          setView({ kind: "signedOut", message: "로그인이 만료됐습니다. 다시 로그인해 주세요." });
          return;
        }
        setView({ kind: "error", message: messageFor(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [token, period, attempt]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onReady={() => setGisReady(true)}
        onError={() =>
          setView({
            kind: "signedOut",
            message: "Google 로그인 스크립트를 불러오지 못했습니다. 광고 차단기를 확인해 주세요.",
          })
        }
      />
      <InnerHeader title="Admin" />
      <main className="space-y-6 pb-12">
        {view.kind === "signedOut" ? (
          <section className="flex flex-col items-start gap-3">
            {view.message && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {view.message}
              </p>
            )}
            <button
              type="button"
              onClick={signIn}
              disabled={!gisReady}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm disabled:opacity-50"
            >
              Google로 로그인
            </button>
          </section>
        ) : (
          <>
            <nav aria-label="기간" className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={p === period}
                  onClick={() => setPeriod(p)}
                  className={tabClass(p === period)}
                >
                  {p}일
                </button>
              ))}
            </nav>
            {view.kind === "loading" && <p className="text-sm text-gray-500">불러오는 중…</p>}
            {view.kind === "error" && (
              <div role="alert" className="flex items-center gap-3 text-sm">
                <span className="text-red-600 dark:text-red-400">{view.message}</span>
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="underline"
                >
                  다시 시도
                </button>
              </div>
            )}
            {view.kind === "ready" && (
              <StatTables stats={view.stats} articles={articleViews(view.stats.pages, articles)} />
            )}
          </>
        )}
      </main>
    </>
  );
}
