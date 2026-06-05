import { useEffect, useRef, useState } from "react";
import { Copy, Info, Trash2, RotateCcw, Quote, Forward } from "lucide-react";

export default function MessageActionMenu({
    isOpen,
    onClose,
    anchorRef,
    isSentByMe,
    messageContent,
    messageType,
    onCopy,
    onDetail,
    onDeleteForMe,
    onRecall,
    onReply,
    onShare,
}) {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0, direction: "down" });

    // Tính vị trí popup
    useEffect(() => {
        if (!isOpen || !anchorRef?.current || !menuRef.current) return;

        const anchorRect = anchorRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top, left;
        let direction = "down";

        // Kiểm tra khoảng trống phía dưới
        const spaceBelow = viewportHeight - anchorRect.bottom;
        const spaceAbove = anchorRect.top;

        if (spaceBelow >= menuRect.height + 8) {
            top = anchorRect.bottom + 4;
            direction = "down";
        } else if (spaceAbove >= menuRect.height + 8) {
            top = anchorRect.top - menuRect.height - 4;
            direction = "up";
        } else {
            top = Math.max(8, viewportHeight - menuRect.height - 8);
            direction = "down";
        }

        // Vị trí ngang
        if (isSentByMe) {
            left = anchorRect.right - menuRect.width;
            if (left < 8) left = 8;
        } else {
            left = anchorRect.left;
            if (left + menuRect.width > viewportWidth - 8) {
                left = viewportWidth - menuRect.width - 8;
            }
        }

        setPosition({ top, left, direction });
    }, [isOpen, isSentByMe]);

    // Click outside để đóng
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        }

        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    // ESC để đóng
    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (messageType === "IMAGE") {
            try {
                const urls = JSON.parse(messageContent);
                navigator.clipboard.writeText(Array.isArray(urls) ? urls.join("\n") : messageContent);
            } catch {
                navigator.clipboard.writeText(messageContent);
            }
        } else {
            navigator.clipboard.writeText(messageContent);
        }
        onCopy?.();
        onClose();
    };

    const menuItems = [
        {
            id: "reply",
            label: "Trả lời",
            icon: <Quote className="w-4 h-4 rotate-180" />,
            onClick: () => { onReply?.(); onClose(); },
            color: "text-gray-700",
            hoverColor: "hover:bg-gray-50",
        },
        {
            id: "share",
            label: "Chia sẻ",
            icon: <Forward className="w-4 h-4" />,
            onClick: () => { onShare?.(); onClose(); },
            color: "text-gray-700",
            hoverColor: "hover:bg-gray-50",
        },
        {
            id: "copy",
            label: "Sao chép",
            icon: <Copy className="w-4 h-4" />,
            onClick: handleCopy,
            color: "text-gray-700",
            hoverColor: "hover:bg-gray-50",
        },
        {
            id: "detail",
            label: "Chi tiết",
            icon: <Info className="w-4 h-4" />,
            onClick: () => { onDetail?.(); onClose(); },
            color: "text-gray-700",
            hoverColor: "hover:bg-gray-50",
        },
        {
            id: "deleteForMe",
            label: "Xóa phía tôi",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => { onDeleteForMe?.(); onClose(); },
            color: "text-red-600",
            hoverColor: "hover:bg-red-50",
        },
        ...(isSentByMe
            ? [
                  {
                      id: "recall",
                      label: "Thu hồi",
                      icon: <RotateCcw className="w-4 h-4" />,
                      onClick: () => { onRecall?.(); onClose(); },
                      color: "text-orange-600",
                      hoverColor: "hover:bg-orange-50",
                  },
              ]
            : []),
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] min-w-[180px] bg-white rounded-xl border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 select-none"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                animation: position.direction === "down"
                    ? "msgMenuSlideDown 0.15s ease-out"
                    : "msgMenuSlideUp 0.15s ease-out",
            }}
        >
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${item.color} ${item.hoverColor} transition-colors cursor-pointer border-none bg-transparent text-left`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
}
