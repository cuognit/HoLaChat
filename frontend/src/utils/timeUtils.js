export const formatRelativeTime = (time, prefix = "") => {
  if (!time) return "";

  const date = new Date(time);
  if (isNaN(date.getTime())) return ""; // invalid date

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
