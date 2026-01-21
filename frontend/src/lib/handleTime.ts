export function getExistTime(items) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`; // 例如 "2025-06-27"

  const filtered = items.filter(item => item.date >= todayStr);
  return filtered.map(item => [item.date, item.time]);
}

export function isPastTime(selectedDate, slotTime) {
  // 判斷是否為今天
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  if (selectedDate !== todayStr) return false; // 不是今天就不需要判斷

  // 取得目前時間（小時與分鐘）
  const nowHour = today.getHours();
  const nowMinute = today.getMinutes();

  // 解析 slotTime
  const [slotHour, slotMinute] = slotTime.split(":").map(Number);

  // 如果時段小於目前時間，就回傳 true
  if (slotHour < nowHour) return true;
  if (slotHour === nowHour && slotMinute <= nowMinute) return true;
  return false;
}

