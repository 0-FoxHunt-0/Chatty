import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const canHover = window.matchMedia('(hover: hover)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (hasCoarsePointer && !canHover && isTouchDevice) return 'mobile';
    if (hasCoarsePointer && canHover && isTouchDevice) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const mediaQueries = {
      coarse: window.matchMedia('(pointer: coarse)'),
      hover: window.matchMedia('(hover: hover)'),
    };

    const updateDeviceType = () => {
      const hasCoarsePointer = mediaQueries.coarse.matches;
      const canHover = mediaQueries.hover.matches;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (hasCoarsePointer && !canHover && isTouchDevice) {
        setDeviceType('mobile');
      } else if (hasCoarsePointer && canHover && isTouchDevice) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    mediaQueries.coarse.addEventListener('change', updateDeviceType);
    mediaQueries.hover.addEventListener('change', updateDeviceType);

    return () => {
      mediaQueries.coarse.removeEventListener('change', updateDeviceType);
      mediaQueries.hover.removeEventListener('change', updateDeviceType);
    };
  }, []);

  return deviceType;
}

