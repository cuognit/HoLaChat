import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Hook phát hiện breakpoint hiện tại (mobile / tablet / desktop).
 * Sử dụng window.matchMedia để reactive khi resize.
 */
export function useResponsive() {
  const [screenType, setScreenType] = useState(() => getScreenType());

  useEffect(() => {
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const tabletQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);

    function handleChange() {
      setScreenType(getScreenType());
    }

    mobileQuery.addEventListener('change', handleChange);
    tabletQuery.addEventListener('change', handleChange);

    return () => {
      mobileQuery.removeEventListener('change', handleChange);
      tabletQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    isMobile: screenType === 'mobile',
    isTablet: screenType === 'tablet',
    isDesktop: screenType === 'desktop',
    screenType,
  };
}

function getScreenType() {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < MOBILE_BREAKPOINT) return 'mobile';
  if (width < TABLET_BREAKPOINT) return 'tablet';
  return 'desktop';
}

export default useResponsive;
