/**
 * File: HomePage.jsx
 * Chức năng: Các trang giao diện chính của ứng dụng.
 */
import React, { useEffect, useState, useCallback } from 'react';
import LeftSidebar from '../components/chat/LeftSidebar';
import MainChat from '../components/chat/MainChat';
import BottomNavBar from '../components/chat/BottomNavBar';
import api from '../api/axiosConfig';
import { useChat } from '../hooks/useChat';
import { useResponsive } from '../hooks/useResponsive';
import { useMobileNavigation } from '../hooks/useMobileNavigation';
import { AuthContext } from '../context/AuthContextInstance.js';
import { useContext } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
    const { accessToken } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const { setCurrentUser, selectedUser, setSelectedUser } = useChat();
    const navigate = useNavigate();
    const { isMobile, isTablet } = useResponsive();
    const {
        mobileView,
        slideDirection,
        goToChatRoom,
        goToChatList,
        goToConversationInfo,
        goBackFromInfo,
        handleTouchStart,
        handleTouchEnd,
        setMobileView,
    } = useMobileNavigation();

    // Bottom nav tab state for mobile
    const [bottomNavTab, setBottomNavTab] = useState('messages');

    useEffect(() => {
        if(accessToken){
           api.get("/auth/user")
           .then(res => {
               setUser(res.data.data);
               setCurrentUser(res.data.data);
           })
           .catch (error => {
               console.error(error.response.data);
               if (error.response.data.status === 401) {
                   localStorage.removeItem('token');
               }
           });
        }
    }, [accessToken, setCurrentUser]);

    // Khi selectedUser thay đổi trên mobile
    useEffect(() => {
        if (!isMobile) return;
        
        if (selectedUser) {
            goToChatRoom();
        } else {
            goToChatList();
        }
    }, [selectedUser, isMobile, goToChatRoom, goToChatList]);

    // Callback khi bấm back từ MainChat trên mobile
    const handleBackToList = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // Callback khi bấm mở ConversationInfo trên mobile
    const handleOpenInfo = useCallback(() => {
        if (isMobile) {
            goToConversationInfo();
        }
    }, [isMobile, goToConversationInfo]);

    // Callback khi bấm back từ ConversationInfo trên mobile
    const handleCloseInfo = useCallback(() => {
        if (isMobile) {
            goBackFromInfo();
        }
    }, [isMobile, goBackFromInfo]);

    // Tính unread count cho bottom nav badge
    const unreadCount = 0; // Will be passed from LeftSidebar

    // Slide animation class cho mobile views
    const getSlideClass = () => {
        if (slideDirection === 'left') return 'mobile-slide-in-right';
        if (slideDirection === 'right') return 'mobile-slide-in-left';
        return '';
    };

    // Loading state
    if (accessToken && !user) {
        return (
            <div className="flex items-center justify-center h-screen w-full text-black">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
        );
    }

    // ============ MOBILE LAYOUT ============
    if (isMobile) {
        return (
            <div
                className="h-screen w-full overflow-hidden bg-white"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* View: Chat List */}
                <div className={`h-full flex flex-col ${mobileView === 'chatList' ? getSlideClass() : 'hidden'}`}>
                    <LeftSidebar
                        avatarUrl={user?.avatarUrl || "/avatar.jpg"}
                        name={user?.userName}
                        email={user?.email}
                        isMobile={true}
                        onSelectAndNavigate={goToChatRoom}
                    />
                    <BottomNavBar
                        activeTab={bottomNavTab}
                        onTabChange={setBottomNavTab}
                        unreadCount={unreadCount}
                    />
                </div>

                {/* View: Chat Room & Conversation Info */}
                <div className={`h-full ${mobileView !== 'chatList' ? getSlideClass() : 'hidden'}`}>
                    <MainChat
                        isMobile={true}
                        onBack={handleBackToList}
                        onOpenInfo={handleOpenInfo}
                        showInfoFullScreen={mobileView === 'conversationInfo'}
                        onCloseInfo={handleCloseInfo}
                    />
                </div>
            </div>
        );
    }

    // ============ TABLET & DESKTOP LAYOUT ============
    return (
        <div className="flex h-screen">
            <LeftSidebar
                avatarUrl={user?.avatarUrl || "/avatar.jpg"}
                name={user?.userName}
                email={user?.email}
                isMobile={false}
                isTablet={isTablet}
            />
            <MainChat isTablet={isTablet} />
        </div>
    );
}
