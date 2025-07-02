export default function NoteTab() {
  return (
    <div className="flex flex-col h-full">
      <textarea
        placeholder="노트를 입력하세요"
        className="flex-1 resize-none focus:outline-none focus:ring-0 focus:border-gray-300"
      />
      <button className="bg-[#6B50FF] hover:bg-[#927ff9] cursor-pointer text-white py-2 rounded-xl">
        Save
      </button>
    </div>
  );
}
