"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
// import Editor from "./editor";
import { useDebounce } from "use-debounce";
import { useEffect, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";
import { Placeholder } from "@tiptap/extension-placeholder";

const supabase = createClient();

export default function Editor({ content }) {
  //   const [debouncedContent] = useDebounce(content, 1000); // 1초 debounce

  const { selectedRoom, setSelectedRoom } = useRoomStore();

  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "여기에 노트를 입력하세요...",
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-xm xm:prose focus:outline-none h-full",
      },
    },
    content,
    onUpdate() {
      //   const html = editor.getHTML();
      //   setContent(html); // ✅ content 갱신
      setStatus("idle"); // 상태도 업데이트
    },
  });
  const [debouncedContent] = useDebounce(editor?.getHTML(), 3000);

  useEffect(() => {
    if (!editor) return;
    if (content === "") {
      editor.commands.clearContent(); // ← 빈 노트일 경우 완전히 초기화
    } else {
      editor.commands.setContent(content); // ← 노트 불러오기
    }
  }, [content, editor]);

  //   useEffect(() => {
  //     if (content) {
  //       editor?.commands.setContent(content);
  //       //   setContent(editor?.getHTML());
  //       setContent("");
  //     }
  //   }, [content]);

  useEffect(() => {
    const save = async () => {
      if (!debouncedContent) return;
      setStatus("saving");
      try {
        // await new Promise((res) => setTimeout(res, 500));

        if (selectedRoom?.note.length === 0) {
          // 노트 없음 → insert
          await supabase.from("note").insert({
            contents: editor?.getHTML(),
            fk_room_id: selectedRoom?.id,
            fk_user_id: selectedRoom?.fk_user_id,
            updated_at: new Date().toISOString(), // ← ✅ Date.now()보다 ISO가 좋음
          });
        } else {
          // 노트 있음 → update
          await supabase
            .from("note")
            .update({
              contents: editor?.getHTML(),
              updated_at: new Date().toISOString(),
            })
            .eq("fk_room_id", selectedRoom?.id);
        }

        const { data } = await supabase
          .from("rooms")
          .select(`*,note(*)`)
          .eq("id", selectedRoom?.id)
          .single();

        setSelectedRoom(data);

        setStatus("saved");
      } catch (err) {
        console.error("저장 실패:", err);
        setStatus("idle");
      }
    };
    save();
  }, [debouncedContent]);

  return (
    <div className="">
      <EditorContent
        editor={editor}
        className="min-h-[200px] h-[calc(100dvh-230px)] overflow-y-auto border-1 p-4 border-[#adadad] rounded-xl"
      />
      <div className="text-sm text-right text-gray-500 mt-2">
        {status === "saving" && "Saving... 💾"}
        {status === "saved" && "Saved ✅"}
        {status === "idle" && "Editing ✏️"}
      </div>
    </div>
  );
}
