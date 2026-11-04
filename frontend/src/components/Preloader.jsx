import { useEffect, useState, useRef } from "react";
import "./Preloader.css";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const requestRef = useRef(null);

  useEffect(() => {
    // Disable scrolling while loader is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const duration = 3000; // 3 seconds exact
    const startTime = performance.now();

    const updateProgress = (now) => {
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / duration, 1);

      // Smooth progress from 1 to 100
      const current = Math.min(100, Math.max(1, Math.floor(1 + ratio * 99)));
      setProgress(current);

      if (ratio < 1) {
        requestRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Reached 100%
        setProgress(100);
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setIsDone(true);
            document.body.style.overflow = originalOverflow;
            if (onComplete) onComplete();
          }, 600); // Wait for fade-out transition
        }, 150);
      }
    };

    requestRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      document.body.style.overflow = originalOverflow;
    };
  }, [onComplete]);

  if (isDone) return null;

  // Dynamic royal perfume craft status messages based on progress
  let statusText = "DISTILLING WILD AGED AGARWOOD...";
  if (progress > 25 && progress <= 55) {
    statusText = "INFUSING PURE AMBER & DAMASCUS ROSE...";
  } else if (progress > 55 && progress <= 85) {
    statusText = "HARMONIZING NOBLE SPICES & ROYAL MUSK...";
  } else if (progress > 85 && progress < 100) {
    statusText = "UNVEILING THE IMPERIAL ATELIER...";
  } else if (progress >= 100) {
    statusText = "WELCOME TO HAYATI ELIXIRS";
  }

  return (
    <div
      className={`luxury-preloader-overlay ${isFading ? "fade-out" : ""}`}
      aria-label="Loading Hayati Elixirs luxury experience"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin="1"
      aria-valuemax="100"
    >
      <div className="preloader-ambient-glow" />
      <div className="preloader-backdrop-pattern" />

      <div className="preloader-content">
        {/* Luxury Golden Emblem */}
        <div className="preloader-emblem">
          <div className="emblem-ring-outer" />
          <div className="emblem-ring-inner" />
          <div className="emblem-diamond">
            <svg
              className="emblem-svg"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="32,6 58,32 32,58 6,32"
                stroke="url(#preloaderGold)"
                strokeWidth="1.5"
                fill="none"
              />
              <polygon
                points="32,16 48,32 32,48 16,32"
                stroke="url(#preloaderGold)"
                strokeWidth="1"
                fill="rgba(214, 176, 106, 0.08)"
              />
              <circle cx="32" cy="32" r="3" fill="url(#preloaderGold)" />
              <defs>
                <linearGradient
                  id="preloaderGold"
                  x1="0"
                  y1="0"
                  x2="64"
                  y2="64"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#fcedc5" />
                  <stop offset="50%" stopColor="#d6b06a" />
                  <stop offset="100%" stopColor="#9b7734" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Brand Names & Titles */}
        <div className="preloader-brand">
          <span className="preloader-arabic-tag">دار الطيب الملكي</span>
          <h1 className="preloader-title">HAYATI ELIXIRS</h1>
          <p className="preloader-subtitle">HAUTE PARFUMERIE • ROYAL OUD</p>
        </div>

        {/* Numeric Counter: 1 to 100 */}
        <div className="preloader-counter-container">
          <span className="preloader-counter-number">
            {progress}
          </span>
          <span className="preloader-counter-percent">%</span>
        </div>

        {/* Sleek Golden Progress Track */}
        <div className="preloader-bar-wrapper">
          <div className="preloader-bar-track">
            <div
              className="preloader-bar-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="preloader-bar-glow-dot" />
            </div>
          </div>
        </div>

        {/* Crafting Stage Subtitle */}
        <div className="preloader-status">
          <span className="preloader-status-dot" />
          <span className="preloader-status-text">{statusText}</span>
        </div>
      </div>
    </div>
  );
}
