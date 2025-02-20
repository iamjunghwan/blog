"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false, // SSR을 비활성화하여 클라이언트에서만 로딩하도록 설정
  }
);

export default function Page() {
  const editorRef = useRef<any>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState("");

  const handleClick = async (): void => {
    if (editorRef.current && titleRef.current) {
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

      console.log(
        "현재 값 : ",
        editorRef.current.getContent({ format: "raw" }),
        titleRef.current.value
      );
      // const response = await fetch("/api/save", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: editorRef.current.getContent({ format: "raw" }),

      //   // JSON.stringify({
      //   //   content: editorRef.current.getContent({ format: "raw" }),
      //   // }),
      // });

      // const result = await response.json();

      const response = await fetch(
        "https://api.memexdata.io/memex/external/projects/0e9c148b/models/blog/contents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Token":
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg",
            "X-Forwarded-Host": "localhost:3000",
          },
          body: JSON.stringify({
            publish: false,
            data: {
              title: {
                KO: titleRef.current.value,
              },
              desc: {
                KO: "string text",
              },
              content: editorRef.current.getContent({ format: "raw" }),
              date: "2022-01-01T00:00:00",
              author: {
                KO: "string text",
              },

              keywords: {
                KO: "string text",
              },
            },
          }),
          // body: JSON.stringify({
          //   content: editorRef.current.getContent({ format: "raw" }),
          // }),
        }
      );

      const data = await response.json();
      console.log(data);
      if (data.ok) {
        alert("저장 성공!!!");
      } else {
        alert("실패 ");
      }
    }
  };

  const editorNodeChange = (e: any) => {
    const node = e.element;

    if (node.tagName.toLowerCase() === "h2" && !node.id) {
      node.id = "h2-" + node.innerHTML;
      console.log(node.id);
      //node.classList.add("clickable");
    }

    if (node.tagName.toLowerCase() === "img") {
      console.log(node.src);
      // blob:http://localhost:3000/fb6e5d66-c9aa-4de8-8e6d-5cb21223d74b
      // node.src =
      //node.src = "http://localhost:3000/fb6e5d66-c9aa-4de8-8e6d-5cb21223d74b";
    }
  };

  return (
    <>
      <label>제목</label>
      <input
        type="text"
        id="title"
        style={{ border: "1px solid black" }}
        ref={titleRef}
      />
      <Editor
        apiKey="9dtzx464fe2jqcmdr9ofs0bb0llu07smvpgbs4qm5oaviohb"
        onInit={(_evt, editor) => (editorRef.current = editor)}
        initialValue=""
        init={{
          height: 600,
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
          file_picker_types: "file image media",
          images_upload_url: "/api/upload", // 이미지 업로드 API URL
          images_upload_handler: async (
            blobInfo: any,
            success: any,
            failure: any
          ) => {
            const formData = new FormData();
            formData.append("file", blobInfo.blob()); // 파일 데이터 전송
            console.log(blobInfo.blob());
            await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })
              .then((response) => response.json())
              .then((data) => {
                console.log("ㅋㅋㅋㅋㅋ ", data);
                if (data.filepath) {
                  // const imageUrl = data.filepath.replace(
                  //   "/Users/iaman/iaman-dev",
                  //   ""
                  // ); // public 폴더를 제외한 경로
                  // const imageUrlWithBase = `${imageUrl}`; // 클라이언트에서 접근 가능한 URL 형태로 변환
                  // console.log("파일 경로 : ", imageUrlWithBase);

                  const tt = data.filepath.replace(
                    "/Users/iaman/iaman-dev/public",
                    ""
                  );
                  //alert(tt);
                  const _imageUrl = `/uploads${tt}}`; // public을 제외한 상대 경로

                  //alert(tt);
                  const fileUrl = `http://localhost:3000/uploads/${data.filepath.replace(
                    "/Users/iaman/iaman-dev/public",
                    ""
                  )}`;
                  console.log("fileUrl : ", fileUrl);
                  success({
                    location: fileUrl,
                    title: "Image Title", // 선택 사항
                    alt: "Image Description", // 선택 사항
                    width: 600, // 선택 사항
                    height: 400, // 선택 사항
                  });

                  //success(tt); // 성공적으로 업로드된 파일의 URL을 에디터에 삽입
                } else {
                  console.log("실패 : ", data.filepath);
                  failure("Failed to upload image.");
                }
              })
              .catch((err) => {
                console.log("캐치 : ");
                failure("Failed to upload image.");
              });
          },
          file_picker_callback: (callback, value, meta) => {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute(
              "accept",
              meta.filetype === "image" ? "image/*" : "video/mp4"
            );
            input.click();

            input.onchange = async function () {
              const file = input.files[0];

              // FormData로 파일을 서버로 전송하여 업로드
              const formData = new FormData();
              formData.append("file", file);

              try {
                // 서버로 파일을 업로드 (예: '/api/upload')
                const response = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });

                const data = await response.json();

                // 업로드 후 서버에서 반환된 파일 경로
                if (data.filepath) {
                  const fileUrl = `/uploads/${data.filepath.replace(
                    "/Users/iaman/iaman-dev/public/uploads/",
                    ""
                  )}`;
                  // 이미지 삽입 (meta.filetype이 "image"인 경우)
                  if (meta.filetype === "image") {
                    callback(fileUrl, { alt: file.name }); // alt는 선택 사항
                  } else if (meta.filetype === "media") {
                    callback(fileUrl, { alt: file.name }); // 비디오 URL 삽입
                  }
                } else {
                  console.error("파일 업로드 실패");
                }
              } catch (err) {
                console.error("파일 업로드 중 에러 발생:", err);
              }
            };
          },
          //  valid_elements: "*[*]",
          extended_valid_elements:
            "span[class|style],div[id|class|style],a[href|target],code[class|style],pre[class],table[class|style],p[class|style],img[src|style]",
          images_file_types: "jpg,svg,webp,mp4",
          block_unsupported_drop: true,
          //tinydrive_token_provider: "/localhost:3000/uploads",
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
      <div
        // style={{ ...parseStyle(editorStyle) }}
        dangerouslySetInnerHTML={{ __html: data }}
      ></div>
    </>
  );
}
