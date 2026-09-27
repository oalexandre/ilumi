"use client";

import { useEffect, useRef, useState } from "react";

interface SceneVideoProps {
  webm: string;
  mp4: string;
  poster: string;
  posterSrcSet: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
  labels: { pause: string; play: string };
  /** The hero clip: fetch it right away instead of when it scrolls near. */
  priority?: boolean;
}

/**
 * A looping, muted recording of the app. It plays only while on screen, never when the
 * visitor asked for reduced motion, and always offers a pause button (WCAG 2.2.2).
 */
export function SceneVideo({
  webm,
  mp4,
  poster,
  posterSrcSet,
  sizes,
  width,
  height,
  alt,
  labels,
  priority,
}: SceneVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  // The poster is a real <img> underneath; the video fades in once it has a frame to show.
  // Same box, so the first frame is never a new, later Largest Contentful Paint.
  const [ready, setReady] = useState(false);
  // null until the visitor presses the button; then their choice wins over autoplay.
  const [choice, setChoice] = useState<"play" | "pause" | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion && choice !== "play") return;
    if (choice === "pause") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (video.preload === "none") video.preload = "auto";
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [choice]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      setChoice("play");
      video.preload = "auto";
      void video.play().catch(() => {});
    } else {
      setChoice("pause");
      video.pause();
    }
  };

  return (
    <div className="clip">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="clip-poster"
        src={poster}
        srcSet={posterSrcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
      <video
        ref={ref}
        className={`clip-video${ready ? " is-ready" : ""}`}
        width={width}
        height={height}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        onPlaying={() => setReady(true)}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      >
        <source src={webm} type="video/webm" />
        <source src={mp4} type="video/mp4" />
      </video>
      <button type="button" className="clip-toggle" onClick={toggle}>
        {paused ? (
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 1.5v9l7.5-4.5z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" fill="currentColor" />
          </svg>
        )}
        {paused ? labels.play : labels.pause}
      </button>
    </div>
  );
}
