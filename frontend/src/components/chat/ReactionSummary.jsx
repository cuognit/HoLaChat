/**
 * File: ReactionSummary.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import React from "react";

export default function ReactionSummary({ reactions, onClick }) {
  if (!reactions || reactions.length === 0) return null;

  // �?m t?ng s? lu?ng v� l?y ra c�c icon duy nh?t
  const emojiSet = new Set();
  reactions.forEach((r) => emojiSet.add(r.emoji));
  const uniqueEmojis = Array.from(emojiSet).slice(0, 3); // Hi?n th? t?i da 3 icon kh�c nhau
  const totalCount = reactions.length;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 shadow-sm rounded-full px-1 py-0.5 flex items-center cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all select-none z-10"
    >
      <div className="flex -space-x-1 pointer-events-none">
        {uniqueEmojis.map((emoji, index) => (
          <span
            key={index}
            className="text-[12px] bg-white rounded-full w-4 h-4 flex items-center justify-center border border-white z-[1]"
            style={{ zIndex: 10 - index }}
          >
            {emoji}
          </span>
        ))}
      </div>
      {totalCount > 1 && (
        <span className="text-[12px] font-semibold text-gray-600 px-0.5 pointer-events-none">
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </div>
  );
}

