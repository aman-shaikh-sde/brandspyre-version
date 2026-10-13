import { useEffect, useState, useRef } from "react";

export const useClickOutside = (
  refs: (React.RefObject<HTMLElement | null> | HTMLElement | null | undefined)[],
  callback: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const isOutside = refs.every((ref) => {
        if (!ref) return true;
        const element = "current" in ref ? ref.current : ref;
        return !element || !element.contains(target);
      });

      if (isOutside && typeof callbackRef.current === "function") {
        callbackRef.current(event);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [refs, enabled]);
};

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia(query);

    const updateMatches = () => setMatches(media.matches);
    updateMatches();

    media.addEventListener("change", updateMatches);
    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
};