/**
 * File: timeUtils.js
 * Chức năng: Các hàm tiện ích dùng chung.
 */
export const parseApiDate = (time) => {
  if (!time) return null;
  if (time instanceof Date) return time;
  if (typeof time === "number") return new Date(time);

  let dateStr = String(time).trim();
  if (/^\d+$/.test(dateStr)) {
    return new Date(Number(dateStr));
  }

  dateStr = dateStr.replace(" ", "T");
  if (!dateStr.endsWith("Z")) {
    dateStr += "Z";
  }
  return new Date(dateStr);
};

export const formatRelativeTime = (time, prefix = "") => {
  if (!time) return "";

  const date = parseApiDate(time);
  if (!date || isNaN(date.getTime())) return ""; // invalid date

  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / 60000);

  if (diffInMins < 1) {
    return prefix ? `${prefix} vừa xong` : "Vừa xong";
  }

  if (diffInMins < 60) {
    return `${prefix}${diffInMins} phút trước`;
  }

  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) {
    return `${prefix}${diffInHours} giờ trước`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${prefix}${day}-${month}-${year}`;
};
