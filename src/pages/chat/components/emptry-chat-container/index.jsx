import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const EmptyChatContainer = () => {
  const containerRef = useRef(null);
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const blob3Ref = useRef(null);
  const textContainerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && blob1Ref.current && blob2Ref.current && blob3Ref.current && textContainerRef.current) {
      gsap.killTweensOf([blob1Ref.current, blob2Ref.current, blob3Ref.current, textContainerRef.current]);

      const commonBlobProps = {
        rotation: '+=360',
        ease: "none",
        repeat: -1,
      };

      gsap.to(blob1Ref.current, {
        ...commonBlobProps,
        x: 'random(-60, 60)',
        y: 'random(-60, 60)',
        scale: 1.1,
        opacity: 0.6,
        duration: 22,
      });

      gsap.to(blob2Ref.current, {
        ...commonBlobProps,
        x: 'random(-80, 80)',
        y: 'random(-80, 80)',
        scale: 1.2,
        opacity: 0.5,
        duration: 20,
        delay: 0.7,
      });

      gsap.to(blob3Ref.current, {
        ...commonBlobProps,
        x: 'random(-50, 50)',
        y: 'random(-50, 50)',
        scale: 1.0,
        opacity: 0.5,
        duration: 18,
        delay: 1.4,
      });

      const textTimeline = gsap.timeline({ repeat: -1, repeatDelay: 4 });

      textTimeline
        .fromTo(
          textContainerRef.current.children,
          { opacity: 0, y: 40, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.5,
            ease: "power3.out",
            stagger: 0.4,
          }
        )
        .to(
          textContainerRef.current.children,
          {
            opacity: 0,
            y: -40,
            scale: 0.98,
            duration: 1.5,
            ease: "power3.in",
            stagger: 0.3,
          },
          "+=6"
        );
    }

    return () => {
      gsap.killTweensOf([blob1Ref.current, blob2Ref.current, blob3Ref.current, textContainerRef.current]);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col justify-center items-center bg-[#15171f] relative overflow-hidden p-6"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 filter-container">
        <div
          ref={blob1Ref}
          className="absolute rounded-full w-60 h-60 bg-gradient-to-br from-indigo-700 to-purple-800 blur-3xl opacity-60"
          style={{ transform: 'translate(-50%, -50%)' }}
        ></div>
        <div
          ref={blob2Ref}
          className="absolute rounded-full w-56 h-56 bg-gradient-to-br from-blue-700 to-cyan-800 blur-3xl opacity-60"
          style={{ transform: 'translate(-50%, -50%)' }}
        ></div>
        <div
          ref={blob3Ref}
          className="absolute rounded-full w-52 h-52 bg-gradient-to-br from-pink-700 to-rose-800 blur-3xl opacity-60"
          style={{ transform: 'translate(-50%, -50%)' }}
        ></div>
      </div>

      <div ref={textContainerRef} className="relative z-10 text-center px-4 max-w-xl">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 text-white drop-shadow-xl leading-tight">
          Welcome to <span className="text-purple-400">EchoSphere</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed">
          Your conversations begin here. Select a chat or find new connections.
        </p>
      </div>

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default EmptyChatContainer;