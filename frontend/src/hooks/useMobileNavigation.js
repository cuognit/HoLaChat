/**
 * File: useMobileNavigation.js
 * Chức năng: Các custom hook dùng chung cho logic React.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook quản lý navigation trên mobile.
 * Views: 'chatList' | 'chatRoom' | 'conversationInfo'
 * Hỗ trợ swipe gesture (swipe right → quay lại) và slide animations.
 */
export function useMobileNavigation() {
  const [mobileView, setMobileView] = useState('chatList'); // 'chatList' | 'chatRoom' | 'conversationInfo'
  const [slideDirection, setSlideDirection] = useState('none'); // 'left' | 'right' | 'none'
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const navigateTo = useCallback((view, direction = 'left') => {
    setSlideDirection(direction);
    setMobileView(view);
  }, []);

  const goToChatRoom = useCallback(() => {
    navigateTo('chatRoom', 'left');
  }, [navigateTo]);

  const goToChatList = useCallback(() => {
    navigateTo('chatList', 'right');
  }, [navigateTo]);

  const goToConversationInfo = useCallback(() => {
    navigateTo('conversationInfo', 'left');
  }, [navigateTo]);

  const goBackFromInfo = useCallback(() => {
    navigateTo('chatRoom', 'right');
  }, [navigateTo]);

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);

    // Swipe right (> 80px horizontal, < 50px vertical) → go back
    if (deltaX > 80 && deltaY < 50) {
      if (mobileView === 'chatRoom') {
        goToChatList();
      } else if (mobileView === 'conversationInfo') {
        goBackFromInfo();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [mobileView, goToChatList, goBackFromInfo]);

  // Clear animation after it plays
  useEffect(() => {
    if (slideDirection !== 'none') {
      const timer = setTimeout(() => setSlideDirection('none'), 300);
      return () => clearTimeout(timer);
    }
  }, [slideDirection, mobileView]);

  return {
    mobileView,
    slideDirection,
    goToChatRoom,
    goToChatList,
    goToConversationInfo,
    goBackFromInfo,
    handleTouchStart,
    handleTouchEnd,
    setMobileView,
  };
}

export default useMobileNavigation;
