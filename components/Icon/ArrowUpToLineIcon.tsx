/** 위에 가로선이 있는 위쪽 화살표(⤒). "맨 위까지"를 뜻한다. stroke가 currentColor라 글자색을 따라간다. */
export default function ArrowUpToLineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4.5h14M12 20V9m0 0-5 5m5-5 5 5" />
    </svg>
  );
}
