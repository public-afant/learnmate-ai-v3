export default function formatChatTimestamp(utcString: string) {
  const date = new Date(utcString);
  // KST(Asia/Seoul)로 변환
  const time = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
  // YYYY-MM-DD 포맷
  const year = date.toLocaleString("en-CA", {
    year: "numeric",
    timeZone: "Asia/Seoul",
  });
  const month = date.toLocaleString("en-CA", {
    month: "2-digit",
    timeZone: "Asia/Seoul",
  });
  const day = date.toLocaleString("en-CA", {
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
  const dateStr = `${year}-${month}-${day}`;
  return { time, date: dateStr };
}
