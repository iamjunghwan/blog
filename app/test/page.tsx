"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false, // SSR을 비활성화하여 클라이언트에서만 로딩하도록 설정
  }
);

export default function Home() {
  const editorRef = useRef<any>(null);

  const [data, setData] = useState("");

  useEffect(() => {
    if (editorRef.current) {
      console.log("ref 변경 : ", editorRef.current.getContent());
    }
  }, [editorRef.current]);

  const handleClick = (): void => {
    if (editorRef.current) {
      setData(editorRef.current.getContent({ format: "raw" }));

      window.localStorage.setItem(
        "fakeData",
        editorRef.current.getContent({ format: "raw" })
      );
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.tiny.cloud/1/9dtzx464fe2jqcmdr9ofs0bb0llu07smvpgbs4qm5oaviohb/tinymce/7.6.1-131/skins/ui/oxide/content.min.css"; // TinyMCE 스타일을 추가
      document.head.appendChild(link);
    }
  };

  const editorNodeChange = (e: { element: HTMLElement }): void => {
    const node = e.element;
    if (node.tagName.toLowerCase() === "h2" && !node.id) {
      node.id = "h2-" + node.innerHTML;
    }
  };

  return (
    <>
      <div
        style={{ height: "100vh" }}
        // style={{ ...parseStyle(editorStyle) }}
        dangerouslySetInnerHTML={{ __html: data }}
      ></div>
      <Editor
        apiKey="9dtzx464fe2jqcmdr9ofs0bb0llu07smvpgbs4qm5oaviohb"
        onInit={(_evt, editor) => (editorRef.current = editor)}
        initialValue=""
        init={{
          height: 300,
          //menubar: "file edit view insert format",
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "tinydrive",
            "media",
            "table",
            "codesample",
            "help",
            "wordcount",
            "emoticons",
          ],
          toolbar:
            "undo redo | blocks | " +
            "bold italic forecolor|separator | alignleft aligncenter " +
            "|custom | link image | codesample | media |" +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat | help",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:8px;text-align: center; }",
          video_template_callback: (data) => {
            console.log("video_template_callback : ", data);
            return `<video width="${data.width}" height="${data.height}" controls>
            <source src="${data.source}" type="video/mp4" />
          </video>`;
            // `<video width="${data.width}" height="${data.height}"${
            //   data.poster ? ` poster="${data.poster}"` : ""
            // } controls="controls">\n` +
            //   `<source src="${data.source}"${
            //     data.sourcemime ? ` type="${data.sourcemime}"` : ""
            //   } />\n` +
            //   (data.altsource
            //     ? `<source src="${data.altsource}"${
            //         data.altsourcemime ? ` type="${data.altsourcemime}"` : ""
            //       } />\n`
            //     : "") +
            //   "</video>";
          },
          font_size_input_default_unit: "8pt",
          image_title: true,
          automatic_uploads: true,
          file_picker_types: "image media",
          file_picker_callback: (callback, value, meta) => {
            // 미디어 파일을 선택할 때의 커스텀 파일 선택 로직
            var input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "video/mp4"); // mp4만 선택하도록 제한
            input.click();

            input.onchange = function () {
              var file = input.files[0]; // 사용자가 선택한 파일
              var reader = new FileReader();

              reader.onload = function (e) {
                // e.target.result는 Base64 URL입니다
                const videoUrl = e.target.result; // Base64로 읽어진 비디오 데이터
                console.log("videoUrl : ", videoUrl);
                // 선택한 비디오를 에디터에 삽입
                callback(videoUrl, { alt: file.name });
              };

              reader.readAsDataURL(file); // 파일을 Base64로 읽기
            };
          },
          //  valid_elements: "*[*]",
          extended_valid_elements:
            "span[class|style],div[id|class|style],a[href|target],code[class|style],pre[class],table[class|style],p[class|style]",
          images_file_types: "jpg,svg,webp,mp4",
          block_unsupported_drop: true,
          tinydrive_token_provider: "/jwt",
          setup: (editor) => {
            // editor.ui.registry.addButton("custom", {
            //   text: "Custom browse",
            //   onAction: () => {
            //     editor.plugins.tinydrive.browse({}).then(() => {
            //       console.log("Tiny Drive dialog closed.");
            //     });
            //   },
            // });

            editor.on("Init", function () {
              // 에디터 DOM 요소에 tabIndex 설정
              const editorContainer = editor.getContainer();
              console.log("editorContainer : ", editorContainer);
              //editorContainer.setAttribute('tabindex', '0');  // 원하는 tabIndex 값 설정
            });
            editor.on("NodeChange", editorNodeChange);
          },
        }}
      />
      <button onClick={handleClick}>글쓰기</button>
    </>
  );
}
