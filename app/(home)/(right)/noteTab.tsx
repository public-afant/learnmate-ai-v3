"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import Editor from "./editor";

const supabase = createClient();

export default function NoteTab({ selectedRoom }) {
  const [content, setContent] = useState("");

  async function getNote() {
    const { data } = await supabase
      .from("note")
      .select()
      .eq("id", selectedRoom?.note[0].id)
      .single();
    setContent(data.contents);
  }

  // 📥 1. 초기 데이터 불러오기
  useEffect(() => {
    if (selectedRoom?.note.length === 0) {
      setContent("");
      return;
    }
    getNote();
    // console.log("state!!");
  }, [selectedRoom]);

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <Editor content={content} setContent={setContent} />
      {/* <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setStatus("idle");
        }}
        placeholder="노트를 입력하세요"
        className="flex-1 resize-none rounded-xl p-3 focus:outline-none focus:ring-2 ring-[#6B50FF] text-sm"
      />

      <div className="border rounded-xl p-4 mt-2 bg-white overflow-y-auto prose prose-xs max-w-none  [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-2  [&_li]:my-0 [&_ul]:my-2 [&ol]:my-2">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {content}
        </ReactMarkdown>
      </div> */}
    </div>
  );
}
