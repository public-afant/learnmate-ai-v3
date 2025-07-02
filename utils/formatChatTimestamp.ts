export default function formatChatTimestamp(isoString: string): {
  date: string;
  time: string;
} {
  const date = new Date(isoString);

  const yy = String(date.getFullYear()).slice(2); // '24'
  const MM = String(date.getMonth() + 1).padStart(2, "0"); // '08'
  const dd = String(date.getDate()).padStart(2, "0"); // '05'
  const hh = String(date.getHours()).padStart(2, "0"); // '08'
  const mm = String(date.getMinutes()).padStart(2, "0"); // '14'

  return {
    date: `${yy}.${MM}.${dd}`,
    time: `${hh}:${mm}`,
  };
}
