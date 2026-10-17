import { useState, useEffect, useRef } from "react";

export function isReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Slow typing effect hook (~45-60ms/char) that respects prefers-reduced-motion.
 * When prefers-reduced-motion is active, displays the entire text immediately without caret.
 */
export function useTypewriter(
  text: string,
  speedMs: number = 50,
  startDelayMs: number = 100
): { displayedText: string; isFinished: boolean; showCaret: boolean } {
  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isReducedMotion()) {
      setDisplayedText(text);
      setIsFinished(true);
      return;
    }

    setDisplayedText("");
    setIsFinished(false);

    let currentIndex = 0;
    let timer: any = null;

    const delayTimer = setTimeout(() => {
      timer = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayedText(text.slice(0, currentIndex));
        } else {
          clearInterval(timer);
          setIsFinished(true);
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(delayTimer);
      if (timer) clearInterval(timer);
    };
  }, [text, speedMs, startDelayMs]);

  return {
    displayedText,
    isFinished,
    showCaret: !isFinished && !isReducedMotion(),
  };
}

/**
 * Scroll reveal hook using IntersectionObserver.
 * Elements fade in and rise when scrolled into view.
 * If prefers-reduced-motion is active, elements are immediately visible.
 */
export function useScrollReveal(delayMs: number = 0) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (delayMs > 0) {
            setTimeout(() => setIsVisible(true), delayMs);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(element);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delayMs]);

  return { ref, isVisible };
}
