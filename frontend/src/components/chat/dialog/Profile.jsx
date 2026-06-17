import React, { useState, useEffect, useRef } from "react";
import { useResponsive } from '../../../hooks/useResponsive';
import { Camera, Pencil, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChat } from "../../../hooks/useChat";
import { updateProfileText, uploadAvatar, uploadCover } from "../../../services/profileService";
import {DashRing} from "../../LoadingUI";

// Hàm nén ảnh bằng HTML5 Canvas (Không cần cài thư viện)
const compressImage = (file, maxWidth, maxHeight, quality = 0.8) => {
    return new Promise((resolve) => {
        // Nếu file quá nhẹ (dưới 100KB) thì không cần nén để tiết kiệm hiệu năng
        if (file.size < 100 * 1024) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Tính toán kích thước mới giữ nguyên tỷ lệ khung hình
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Xuất ra Blob dưới dạng ảnh JPEG để nén tối đa dung lượng
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file); // Fallback về file gốc nếu có lỗi
                        }
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};
export default function Profile({ avatarUrl, userName, email, onClose }) {
    const { currentUser, setCurrentUser } = useChat();
    const { isMobile } = useResponsive();
    const userEmail = email || currentUser?.email || "";

    const [profileData, setProfileData] = useState({
        userName: currentUser?.userName || userName || "Người dùng",
        avatarUrl: currentUser?.avatarUrl || avatarUrl || "/avatar.jpg",
        coverUrl: currentUser?.coverUrl || "",
        gender: currentUser?.gender || "Nam",
        birthday: currentUser?.birthday || ""
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isSavingText, setIsSavingText] = useState(false);

    // Temp form states
    const [tempName, setTempName] = useState(profileData.userName);
    const [tempGender, setTempGender] = useState(profileData.gender);
    const [tempBirthday, setTempBirthday] = useState(profileData.birthday);
    const [tempAvatarUrl, setTempAvatarUrl] = useState(profileData.avatarUrl);
    const [tempCoverUrl, setTempCoverUrl] = useState(profileData.coverUrl);

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Sync profileData with currentUser context when it loads
    useEffect(() => {
        if (currentUser) {
            const updated = {
                userName: currentUser.userName || userName || "Người dùng",
                avatarUrl: currentUser.avatarUrl || avatarUrl || "/avatar.jpg",
                coverUrl: currentUser.coverUrl || "",
                gender: currentUser.gender || "Nam",
                birthday: currentUser.birthday || ""
            };
            setProfileData(updated);
        }
    }, [currentUser, userName, avatarUrl]);

    // Sync temp states when profileData updates
    useEffect(() => {
        setTempName(profileData.userName);
        setTempGender(profileData.gender);
        setTempBirthday(profileData.birthday);
        setTempAvatarUrl(profileData.avatarUrl);
        setTempCoverUrl(profileData.coverUrl);
    }, [profileData]);

    const formatBirthday = (dateString) => {
        if (!dateString) return "--/--/----";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "--/--/----";
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return "--/--/----";
        }
    };

    const handleAvatarClick = () => {
        if (avatarInputRef.current) {
            avatarInputRef.current.click();
        }
    };

    const handleCoverClick = () => {
        if (coverInputRef.current) {
            coverInputRef.current.click();
        }
    };

        const handleAvatarFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            // 1. Tự động nén ảnh đại diện về tối đa 400x400 pixel, chất lượng 85%
            const compressedFile = await compressImage(file, 400, 400, 0.85);
            console.log(`[Avatar] Gốc: ${(file.size / 1024).toFixed(1)}KB -> Nén: ${(compressedFile.size / 1024).toFixed(1)}KB`);

            // 2. Gửi file đã nén lên Server
            const updatedUser = await uploadAvatar(compressedFile);
            const newUrl = updatedUser?.avatarUrl || "/avatar.jpg";
            setTempAvatarUrl(newUrl);
            setProfileData(prev => ({ ...prev, avatarUrl: newUrl }));
            if (setCurrentUser) {
                setCurrentUser(updatedUser);
            }
            toast.success("Cập nhật ảnh đại diện thành công!");
        } catch (error) {
            console.error("Avatar upload error:", error);
            toast.error(error.response?.data?.message || "Không thể tải ảnh đại diện lên Cloudinary.");
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = ""; // Clear file selector
        }
    };

    const handleCoverFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingCover(true);
        try {
            // 1. Tự động nén ảnh bìa về tối đa 1200x600 pixel, chất lượng 80%
            const compressedFile = await compressImage(file, 1200, 600, 0.8);
            console.log(`[Cover] Gốc: ${(file.size / 1024).toFixed(1)}KB -> Nén: ${(compressedFile.size / 1024).toFixed(1)}KB`);

            // 2. Gửi file đã nén lên Server
            const updatedUser = await uploadCover(compressedFile);
            const newUrl = updatedUser?.coverUrl || "";
            setTempCoverUrl(newUrl);
            setProfileData(prev => ({ ...prev, coverUrl: newUrl }));
            if (setCurrentUser) {
                setCurrentUser(updatedUser);
            }
            toast.success("Cập nhật ảnh bìa thành công!");
        } catch (error) {
            console.error("Cover upload error:", error);
            toast.error(error.response?.data?.message || "Không thể tải ảnh bìa lên Cloudinary.");
        } finally {
            setIsUploadingCover(false);
            e.target.value = ""; // Clear file selector
        }
    };

    const handleCancel = () => {
        setTempName(profileData.userName);
        setTempGender(profileData.gender);
        setTempBirthday(profileData.birthday);
        setTempAvatarUrl(profileData.avatarUrl);
        setTempCoverUrl(profileData.coverUrl);
        setIsEditing(false);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();

        if (!tempName.trim()) {
            toast.warning("Tên hiển thị không được để trống!");
            return;
        }

        setIsSavingText(true);
        try {
            const updatedUser = await updateProfileText({
                userName: tempName.trim(),
                gender: tempGender,
                birthday: tempBirthday || null
            });

            // Update local state with Postgres response
            const newProfile = {
                userName: updatedUser.userName,
                avatarUrl: updatedUser.avatarUrl,
                coverUrl: updatedUser.coverUrl || "",
                gender: updatedUser.gender || "Nam",
                birthday: updatedUser.birthday || ""
            };
            setProfileData(newProfile);

            // Sync to ChatContext
            if (setCurrentUser) {
                setCurrentUser(updatedUser);
            }

            toast.success("Cập nhật thông tin cá nhân thành công!");
            setIsEditing(false);
        } catch (error) {
            console.error("Profile update text error:", error);
            toast.error(error.response?.data?.message || "Không thể lưu thông tin cá nhân.");
        } finally {
            setIsSavingText(false);
        }
    };

    return (
        <div className={`max-w-full bg-white text-gray-800 flex flex-col font-sans select-none rounded-2xl shadow-2xl border border-gray-200 relative ${isMobile ? 'w-full' : 'w-[400px]'}`}>
            {/* Native Hidden File Inputs */}
            <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarFileChange} 
            />
            <input 
                type="file" 
                ref={coverInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleCoverFileChange} 
            />

            {/* Overall Loading Spinner for Saving */}
            {isSavingText && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-700 font-semibold">Đang lưu thay đổi...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
                <span className="text-lg font-bold text-gray-900">Thông tin tài khoản</span>
                {onClose && (
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Đóng"
                        disabled={isSavingText || isUploadingAvatar || isUploadingCover}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Cover and Avatar Container */}
            <div className={`relative w-full bg-white shrink-0 overflow-hidden border-b border-gray-100 ${isMobile ? 'h-36' : 'h-44'}`}>
                {(isEditing ? tempCoverUrl : profileData.coverUrl) ? (
                    <img 
                        src={isEditing ? tempCoverUrl : profileData.coverUrl} 
                        alt="Cover" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                            e.target.src = ""; // Fallback to white if error
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-1.5">
                        <div className="p-2.5 bg-gray-50 rounded-full border border-gray-100 shadow-xs">
                            <Camera size={22} className="text-gray-400" />
                        </div>
                        <span className="text-[11px] text-gray-400 font-semibold tracking-wide uppercase">Chưa có ảnh bìa</span>
                    </div>
                )}

                {/* Uploading Cover Overlay */}
                {isUploadingCover && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                            <DashRing className="w-8 h-8 text-blue-600" />
                            <span className="text-xs text-gray-800 font-semibold">Đang tải ảnh bìa...</span>
                        </div>
                    </div>
                )}
                
                {/* Cover Edit Camera Button (visible only in edit mode) */}
                {isEditing && !isUploadingCover && (
                    <button 
                        type="button"
                        onClick={handleCoverClick}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full cursor-pointer transition-all border border-gray-200 flex items-center justify-center shadow-md hover:scale-105"
                        title="Thay đổi ảnh bìa"
                    >
                        <Camera size={16} />
                    </button>
                )}
            </div>

            {/* Profile Content Body */}
            <div className={`pb-6 pt-2 ${isMobile ? 'px-4' : 'px-6'}`}>
                {/* Avatar and User Name row, offset overlapping the cover image bottom */}
                <div className="flex items-end gap-4 -mt-10 mb-5 relative z-10">
                    <div className="relative w-20 h-20">
                        <img 
                            src={isEditing ? (tempAvatarUrl || "/avatar.jpg") : (profileData.avatarUrl || "/avatar.jpg")} 
                            alt="Avatar" 
                            className="w-full h-full rounded-full object-cover border-4 border-white bg-white shadow-md ring-1 ring-gray-100/50"
                            onError={(e) => {
                                e.target.src = "/avatar.jpg";
                            }}
                        />

                        {/* Uploading Avatar Overlay */}
                        {isUploadingAvatar && (
                            <div className="absolute inset-0 rounded-full bg-white/70 backdrop-blur-xs flex items-center justify-center z-20 border-4 border-white">
                                <DashRing className="w-5 h-5 text-blue-600" />
                            </div>
                        )}

                        {isEditing && !isUploadingAvatar && (
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                className="absolute bottom-0 right-0 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 p-1.5 rounded-full border-2 border-white cursor-pointer transition-all flex items-center justify-center shadow-md hover:scale-105"
                                title="Thay đổi ảnh đại diện"
                            >
                                <Camera size={14} />
                            </button>
                        )}
                    </div>
                    
                    {/* User Name & Pencil */}
                    <div className="flex-1 pb-1 flex items-center gap-2">
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className={`bg-white text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-lg font-semibold w-full shadow-xs ${isMobile ? 'max-w-full' : 'max-w-[200px]'}`}
                                placeholder="Tên hiển thị"
                                maxLength={50}
                            />
                        ) : (
                            <>
                                <h2 className={`text-xl font-bold truncate text-gray-900 ${isMobile ? 'max-w-[180px]' : 'max-w-[210px]'}`} title={profileData.userName}>
                                    {profileData.userName}
                                </h2>
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditing(true)} 
                                    className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer p-1 rounded-full"
                                    title="Chỉnh sửa tên"
                                >
                                    <Pencil size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4">
                    {/* Thông tin cá nhân section */}
                    <div className="flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider text-[11px] font-bold">Thông tin cá nhân</h3>
                        
                        {/* Giới tính Row */}
                        <div className="flex py-3 border-b border-gray-100 items-center text-sm">
                            <span className="w-28 text-gray-500 font-medium">Giới tính</span>
                             {isEditing ? (
                                <select 
                                    value={tempGender}
                                    onChange={(e) => setTempGender(e.target.value)}
                                    className="bg-white text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-sm cursor-pointer shadow-xs"
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            ) : (
                                <span className="text-gray-900 font-semibold">{profileData.gender}</span>
                            )}
                        </div>

                        {/* Ngày sinh Row */}
                        <div className="flex py-3 border-b border-gray-100 items-center text-sm">
                            <span className="w-28 text-gray-500 font-medium">Ngày sinh</span>
                             {isEditing ? (
                                <input 
                                    type="date"
                                    value={tempBirthday}
                                    onChange={(e) => setTempBirthday(e.target.value)}
                                    className="bg-white text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-sm cursor-pointer shadow-xs"
                                />
                            ) : (
                                <span className="text-gray-900 font-semibold">{formatBirthday(profileData.birthday)}</span>
                            )}
                        </div>

                        {/* Email Row (Replaces Điện thoại) */}
                        <div className="flex py-3 border-b border-gray-100 items-center text-sm">
                            <span className="w-28 text-gray-500 font-medium">Email</span>
                            <span className="text-gray-900 font-semibold truncate flex-1" title={userEmail}>
                                {userEmail}
                            </span>
                        </div>
                    </div>

                    {/* Disclaimer text */}
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        Chỉ bạn bè có trong danh bạ của bạn mới có thể thấy những thông tin liên lạc này.
                    </p>

                    {/* Footer Buttons */}
                    {isEditing ? (
                        <div className="flex justify-center gap-3 pt-4 border-t border-gray-100 mt-2">
                            <button 
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center justify-center gap-2 px-5 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-full transition-all cursor-pointer font-medium text-sm border border-gray-300 w-28"
                                disabled={isSavingText || isUploadingAvatar || isUploadingCover}
                            >
                                <X size={16} />
                                Hủy
                            </button>
                            <button 
                                type="submit"
                                className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full transition-all cursor-pointer font-medium text-sm shadow-md w-28"
                                disabled={isSavingText || isUploadingAvatar || isUploadingCover}
                            >
                                <Check size={16} />
                                Lưu
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center pt-4 border-t border-gray-100 mt-2">
                            <button 
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-blue-600 rounded-full transition-all cursor-pointer font-semibold text-sm border border-blue-200 hover:border-blue-300 shadow-xs hover:scale-[1.02]"
                            >
                                <Pencil size={15} />
                                Chỉnh sửa thông tin
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
