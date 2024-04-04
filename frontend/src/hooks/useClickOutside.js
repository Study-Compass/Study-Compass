import { useEffect } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref
 */
function useOutsideClick(ref, onOutsideClick, exclude = []) {
  useEffect(() => {
    /**
     * Call the handler if clicked on outside of element
     */
    function handleClickOutside(event) {
      if (exclude.length > 0) {
        for (let i = 0; i < exclude.length; i++) {
          if (event.target.className.includes(exclude[i])) {
            return;
          }
        }
      }
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick();
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
}

export default useOutsideClick;