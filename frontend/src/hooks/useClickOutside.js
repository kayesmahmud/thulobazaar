import { useEffect, useRef } from 'react';

/**
 * Hook to detect clicks outside of a component
 * Useful for closing dropdowns, modals, etc.
 * @param {Function} handler - Function to call when clicking outside
 * @returns {RefObject} - Ref to attach to the component
 */
function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler]);

  return ref;
}

export default useClickOutside;
