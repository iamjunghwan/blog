declare module "subset-font" {
  /**
   * 폰트에서 주어진 글자만 남긴다. harfbuzz를 wasm으로 돌린다.
   * 타입 정의를 같이 배포하지 않아 여기서 쓰는 만큼만 적는다.
   */
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: {
      targetFormat?: "sfnt" | "woff" | "woff2";
      preserveNameIds?: number[];
      variationAxes?: Record<string, { min?: number; max?: number; default?: number }>;
    }
  ): Promise<Buffer>;
}
