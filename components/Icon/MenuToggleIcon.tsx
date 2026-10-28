/**
 * 햄버거 메뉴.
 *
 * 예전에는 public/MenuToggle.svg 를 @svgr/webpack 으로 컴포넌트로 바꿔 썼다.
 * 아이콘 4개 때문에 babel·svgo를 포함해 117개 패키지가 딸려 와서 직접 적는다.
 * stroke가 currentColor라 글자색을 따라간다 — <img>로는 안 되는 부분이다.
 */
export default function MenuToggleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}
