export default function FilterJson(text) {
  // JSON 부분 추출하기
  const jsonStart = text.indexOf("```json");
  const jsonEnd = text.indexOf("```", jsonStart + 6);
  // console.log(text);

  if (jsonStart === -1) return { message: text };

  // JSON 문자열 추출
  const jsonString = text.substring(jsonStart + 7, jsonEnd).trim();

  // 나머지 텍스트 추출
  const textOnly =
    text.substring(0, jsonStart).trim() +
    "\n" +
    text.substring(jsonEnd + 3).trim();

  // JSON 문자열을 객체로 파싱
  let jsonData;
  try {
    jsonData = JSON.parse(jsonString);
    // console.log(jsonData);
  } catch (e) {
    console.error("JSON 파싱 오류:", e);
  }

  return { message: textOnly, json: jsonData };
}
