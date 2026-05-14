import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  isPasswordFocused: boolean;
  isUsernameHovered: boolean;
  isTyping: boolean;
  isSuccess: boolean;
}

const mouthNeutral = "M -10 10 Q 0 15 10 10";
const mouthSmile = "M -12 8 Q 0 20 12 8";
const mouthOoh = "M -4 12 Q 0 5 4 12 Q 0 16 -4 12";
const mouthFlat = "M -10 12 L 10 12";
const mouthSurprise = "M 0 10 A 3 3 0 1 0 0 16 A 3 3 0 1 0 0 10";

export default function InteractiveCharacters({ 
  isPasswordFocused, 
  isUsernameHovered, 
  isTyping,
  isSuccess 
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const characters = containerRef.current.querySelectorAll(".character");
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isPasswordFocused) return;

      const x = e.clientX;
      const y = e.clientY;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const moveX = (x / windowWidth - 0.5) * 15;
      const moveY = (y / windowHeight - 0.5) * 15;

      characters.forEach((char) => {
        const pupils = char.querySelectorAll(".pupil");
        gsap.to(pupils, {
          x: moveX,
          y: moveY,
          duration: 0.2,
          ease: "power2.out"
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPasswordFocused]);

  useEffect(() => {
    if (!containerRef.current) return;
    const characters = containerRef.current.querySelectorAll(".character");

    characters.forEach((char, index) => {
      const mouth = char.querySelector(".mouth");
      const body = char.querySelector(".body");
      const pupils = char.querySelectorAll(".pupil");

      if (isSuccess) {
        gsap.to(mouth, { attr: { d: mouthSmile }, duration: 0.2 });
        gsap.to(pupils, { x: 0, y: -2, duration: 0.2 });
        gsap.to(char, {
          y: -60,
          duration: 0.3,
          yoyo: true,
          repeat: 3,
          delay: index * 0.05,
          ease: "sine.inOut",
        });
      } else if (isPasswordFocused) {
        const lookDistX = index % 2 === 0 ? -12 : 12;
        gsap.to(pupils, { x: lookDistX, y: -12, duration: 0.5, ease: "power2.inOut" });
        gsap.to(mouth, { attr: { d: mouthFlat }, duration: 0.3 });
      } else if (isUsernameHovered) {
        if (index % 2 === 0) {
          gsap.to(mouth, { attr: { d: mouthSmile }, duration: 0.2 });
        } else {
          gsap.to(mouth, { attr: { d: mouthSurprise }, duration: 0.2 });
          gsap.to(body, { y: -8, duration: 0.2 });
        }
      } else {
        gsap.to(mouth, { attr: { d: mouthNeutral }, duration: 0.3 });
        gsap.to(body, { y: 0, duration: 0.3 });
        if (!isTyping) {
            gsap.to(pupils, { x: 0, y: 0, duration: 0.5 });
        }
      }
    });
  }, [isPasswordFocused, isUsernameHovered, isSuccess]);

  useEffect(() => {
    if (isTyping && !isPasswordFocused) {
      const characters = containerRef.current?.querySelectorAll(".character");
      characters?.forEach((char) => {
        const body = char.querySelector(".body");
        gsap.fromTo(body, { y: 0 }, { y: 8, duration: 0.1, yoyo: true, repeat: 1 });
      });
    }
  }, [isTyping]);

  return (
    <div ref={containerRef} className="w-full h-[220px] mb-[-30px] relative z-0 flex justify-center">
      <svg viewBox="0 0 800 300" className="w-full max-w-[900px] overflow-visible">
        {/* 1. Very Big Character (Left) - Vibrant Blue */}
        <g className="character" transform="translate(160, 150) scale(1.8)">
          <rect x="-40" y="-30" width="80" height="130" rx="40" fill="#4CC9F0" className="body shadow-lg" />
          <g className="eyes">
            <circle cx="-15" cy="-10" r="13" fill="white" />
            <circle cx="-15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
            <circle cx="15" cy="-10" r="13" fill="white" />
            <circle cx="15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
          </g>
          <path d={mouthNeutral} stroke="#1A1B2E" strokeWidth="4" fill="none" strokeLinecap="round" className="mouth" />
        </g>

        {/* 2. Very Big Character (Right) - Vibrant Pink */}
        <g className="character" transform="translate(640, 140) scale(1.7)">
          <rect x="-40" y="-30" width="80" height="130" rx="40" fill="#F72585" className="body shadow-lg" />
          <g className="eyes">
            <circle cx="-15" cy="-10" r="13" fill="white" />
            <circle cx="-15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
            <circle cx="15" cy="-10" r="13" fill="white" />
            <circle cx="15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
          </g>
          <path d={mouthNeutral} stroke="#1A1B2E" strokeWidth="4" fill="none" strokeLinecap="round" className="mouth" />
        </g>

        {/* 3. Medium Character - Vibrant Yellow */}
        <g className="character" transform="translate(400, 180) scale(1.3)">
          <rect x="-40" y="-30" width="80" height="110" rx="40" fill="#FFB703" className="body shadow-lg" />
          <g className="eyes">
            <circle cx="-15" cy="-10" r="13" fill="white" />
            <circle cx="-15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
            <circle cx="15" cy="-10" r="13" fill="white" />
            <circle cx="15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
          </g>
          <path d={mouthNeutral} stroke="#1A1B2E" strokeWidth="4" fill="none" strokeLinecap="round" className="mouth" />
        </g>

        {/* 4. Small Character 1 - Vibrant Green */}
        <g className="character" transform="translate(280, 210) scale(0.9)">
          <rect x="-40" y="-30" width="80" height="100" rx="40" fill="#4AD66D" className="body shadow-lg" />
          <g className="eyes">
            <circle cx="-15" cy="-10" r="13" fill="white" />
            <circle cx="-15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
            <circle cx="15" cy="-10" r="13" fill="white" />
            <circle cx="15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
          </g>
          <path d={mouthNeutral} stroke="#1A1B2E" strokeWidth="4" fill="none" strokeLinecap="round" className="mouth" />
        </g>

        {/* 5. Small Character 2 - Vibrant Orange */}
        <g className="character" transform="translate(520, 200) scale(0.85)">
          <rect x="-40" y="-30" width="80" height="100" rx="40" fill="#FB8500" className="body shadow-lg" />
          <g className="eyes">
            <circle cx="-15" cy="-10" r="13" fill="white" />
            <circle cx="-15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
            <circle cx="15" cy="-10" r="13" fill="white" />
            <circle cx="15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
          </g>
          <path d={mouthNeutral} stroke="#1A1B2E" strokeWidth="4" fill="none" strokeLinecap="round" className="mouth" />
        </g>

        {/* 6. Very Small Character - Vibrant Purple */}
        <g className="character" transform="translate(360, 230) scale(0.6)">
          <rect x="-40" y="-30" width="80" height="100" rx="40" fill="#7209B7" className="body shadow-lg" />
          <g className="eyes">
            <circle cx="-15" cy="-10" r="13" fill="white" />
            <circle cx="-15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
            <circle cx="15" cy="-10" r="13" fill="white" />
            <circle cx="15" cy="-10" r="6" fill="#1A1B2E" className="pupil" />
          </g>
          <path d={mouthNeutral} stroke="#1A1B2E" strokeWidth="4" fill="none" strokeLinecap="round" className="mouth" />
        </g>
      </svg>
    </div>
  );
}
