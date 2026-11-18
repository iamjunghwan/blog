import type { Ga4Stats, Row } from "@/app/lib/analytics/ga4";
import type { ArticleViews } from "@/app/lib/analytics/articles";
import { articleUrl, indexFailure, type IndexStatus } from "@/app/lib/analytics/searchConsole";

const format = (value: number) => value.toLocaleString("ko-KR");

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{format(value)}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function RowTable({ rows, valueLabel }: { rows: Row[]; valueLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">데이터 없음</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
          <th className="py-1 font-normal">항목</th>
          <th className="py-1 text-right font-normal">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-gray-100 dark:border-gray-900">
            <td className="py-1">{row.label}</td>
            <td className="py-1 text-right tabular-nums">{format(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const INDEX_LABEL: Record<IndexStatus["state"], string> = {
  pending: "…",
  indexed: "✅ 색인",
  notIndexed: "⏳ 미색인",
  unknown: "❌ 모름",
  error: "–",
};

/** status가 없으면 그 언어판이 없는 글이다 — 빈 칸. */
function IndexCell({ status }: { status: IndexStatus | undefined }) {
  if (!status) {
    return <td className="py-1 pl-3" />;
  }
  const title = status.lastCrawl
    ? `${status.detail} · 마지막 크롤링 ${status.lastCrawl}`
    : status.detail;

  return (
    <td className="py-1 pl-3 text-right whitespace-nowrap" title={title}>
      {INDEX_LABEL[status.state]}
    </td>
  );
}

function ArticleTable({
  articles,
  index,
}: {
  articles: ArticleViews[];
  index: Record<string, IndexStatus>;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
          <th className="py-1 font-normal">글</th>
          <th className="py-1 text-right font-normal">합계</th>
          <th className="py-1 text-right font-normal">ko</th>
          <th className="py-1 text-right font-normal">en</th>
          <th className="py-1 pl-3 text-right font-normal">색인 ko</th>
          <th className="py-1 pl-3 text-right font-normal">색인 en</th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <tr key={article.slug} className="border-b border-gray-100 dark:border-gray-900">
            <td className="py-1">
              <a href={`/${article.slug}`} className="hover:underline">
                {article.title}
              </a>
            </td>
            <td className="py-1 text-right tabular-nums font-bold">{format(article.total)}</td>
            <td className="py-1 text-right tabular-nums">{format(article.ko)}</td>
            <td className="py-1 text-right tabular-nums">{format(article.en)}</td>
            <IndexCell status={index[articleUrl(article.slug, "ko")]} />
            <IndexCell status={index[articleUrl(article.slug, "en")]} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StatTables({
  stats,
  articles,
  index,
}: {
  stats: Ga4Stats;
  articles: ArticleViews[];
  index: Record<string, IndexStatus>;
}) {
  const failure = indexFailure(index);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3 max-[500px]:grid-cols-1">
        <Card label="방문자" value={stats.summary.users} />
        <Card label="조회수" value={stats.summary.views} />
        <Card label="세션" value={stats.summary.sessions} />
      </div>
      <Section title="아티클 조회수">
        {failure && (
          <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">
            {failure}
          </p>
        )}
        <div className="overflow-x-auto">
          <ArticleTable articles={articles} index={index} />
        </div>
      </Section>
      <div className="grid grid-cols-3 gap-6 max-[800px]:grid-cols-1">
        <Section title="방문 국가">
          <RowTable rows={stats.countries} valueLabel="방문자" />
        </Section>
        <Section title="유입 채널">
          <RowTable rows={stats.channels} valueLabel="세션" />
        </Section>
        <Section title="유입 소스">
          <RowTable rows={stats.sources} valueLabel="세션" />
        </Section>
      </div>
    </div>
  );
}
