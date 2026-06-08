import React from "react";
import { X } from "lucide-react";

export default function ReactionDetailModal({ isOpen, onClose, reactions, currentUserId, onRemoveReaction }) {
  if (!isOpen || !reactions) return null;

  // Sắp xếp: nếu là mình thì đưa lên đầu
  const sortedReactions = [...reactions].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-lg">
            Cảm xúc ({reactions.length})
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {reactions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Chưa có cảm xúc nào
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {sortedReactions.map((r, i) => {
                const isMe = r.userId === currentUserId;
                return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isMe ? "hover:bg-red-50 cursor-pointer" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (isMe && onRemoveReaction) {
                      onRemoveReaction();
                      onClose();
                    }
                  }}
                  title={isMe ? "Nhấn để gỡ cảm xúc" : ""}
                >
                  <div className="relative">
                    <img
                      src={r.avatarUrl || "/avatar.jpg"}
                      alt={r.userName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-[12px] shadow-sm border border-gray-100">
                      {r.emoji}
                    </div>
                  </div>
                  <span className="font-medium text-gray-800 text-[15px]">
                    {isMe ? "Bạn" : r.userName}
                  </span>
                  {isMe && (
                    <span className="ml-auto text-xs text-red-500 font-medium">Nhấn để gỡ</span>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
