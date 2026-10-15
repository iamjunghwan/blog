/****************************************
 *
 * 글 날짜를 "오늘 / 어제 / N일 전"으로 바꾼다.
 *
 * 이 블로그는 output: "export" 정적 사이트다. 빌드 시점에 계산하면 배포 순간의
 * 값이 HTML에 박히므로, 호출부(CardDateArea)가 브라우저에서 now를 넘겨 쓴다.
 * now를 인자로 받는 이유는 그 때문이기도 하고, 테스트에서 시간을 고정하기 위해서다.
 *
 ****************************************/

import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";

/** 이 일수를 넘으면 상대 표기를 붙이지 않는다. 640일 전 같은 값은 감이 오지 않는다. */
export const RELATIVE_LIMIT_DAYS = 30;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param date parsePost가 정규화한 "YYYY-MM-DD"
 * @param now  보는 시점 (브라우저의 new Date())
 * @param lang 문구를 고를 언어
 * @returns 붙일 문구, 또는 붙이지 않아야 하면 null
 */
export function relativeLabel(
  date: string,
  now: Date,
  lang: Lang
): string | null {
  const days = daysSince(date, now);

  if (days === null || days < 0 || days > RELATIVE_LIMIT_DAYS) {
    return null;
  }

  const t = messages(lang);

  if (days === 0) {
    return t.today;
  }
  if (days === 1) {
    return t.yesterday;
  }
  return t.daysAgo(days);
}

/**
 * 두 날짜 사이의 "달력 일수"를 센다. 경과 시간이 아니다.
 *
 * new Date("2026-10-14")는 UTC 자정으로 해석된다. 음수 시간대(예: UTC-5)에서는
 * 전날로 밀려 하루가 어긋난다. 그래서 연·월·일을 직접 넘겨 **로컬 자정**으로 만들고,
 * 오늘도 로컬 자정으로 맞춘 뒤 뺀다.
 */
function daysSince(date: string, now: Date): number | null {
  const match = DATE_PATTERN.exec(date);
  if (match === null) {
    return null;
  }

  const [, year, month, day] = match;
  const posted = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(posted.getTime())) {
    return null;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 서머타임이 끼면 하루가 23시간이나 25시간이 된다. round가 그걸 흡수한다.
  return Math.round((today.getTime() - posted.getTime()) / MS_PER_DAY);
}
