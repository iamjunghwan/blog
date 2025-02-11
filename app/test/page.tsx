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
          menubar: "file edit view insert format",
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
          video_template_callback: (data) =>
            `<video width="${data.width}" height="${data.height}"${
              data.poster ? ` poster="${data.poster}"` : ""
            } controls="controls">\n` +
            `<source src="${data.source}"${
              data.sourcemime ? ` type="${data.sourcemime}"` : ""
            } />\n` +
            (data.altsource
              ? `<source src="${data.altsource}"${
                  data.altsourcemime ? ` type="${data.altsourcemime}"` : ""
                } />\n`
              : "") +
            "</video>",
          font_size_input_default_unit: "8pt",
          image_title: true,
          automatic_uploads: true,
          file_picker_callback: (cb, value, meta) => {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");

            input.addEventListener("change", (e) => {
              console.log("변경");
              const file = e.target.files[0];

              const reader = new FileReader();
              reader.addEventListener("load", () => {
                /*
                  Note: Now we need to register the blob in TinyMCEs image blob
                  registry. In the next release this part hopefully won't be
                  necessary, as we are looking to handle it internally.
                */
                const id = "blobid";

                const blobCache = tinymce.activeEditor.editorUpload.blobCache;
                const base64 = reader.result.split(",")[1];
                const blobInfo = blobCache.create(id, file, base64);
                blobCache.add(blobInfo);

                /* call the callback and populate the Title field with the file name */
                cb(blobInfo.blobUri(), { title: file.name });
              });
              reader.readAsDataURL(file);
            });

            input.click();
          },
          //  valid_elements: "*[*]",
          extended_valid_elements:
            "span[class|style],div[id|class|style],a[href|target],code[class|style],pre[class],table,p[class|style]",
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
