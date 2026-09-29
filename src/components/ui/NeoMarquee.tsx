"use client";
import React from 'react';

interface NeoMarqueeProps {
  messages: string[];
}

export function NeoMarquee({ messages }: NeoMarqueeProps) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="relative flex overflow-x-hidden rounded-3xl border border-neutral-200 bg-neutral-900 p-6 md:p-8 mb-8 group items-center shadow-xs">
      {/* Decorative pulse dot for "Live" notification feel */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2 rounded-full bg-neutral-800/80 px-3 py-1.5 backdrop-blur-md border border-neutral-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="text-xs font-bold text-white uppercase tracking-wider">Tin nóng</span>
      </div>

      <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex shrink-0 animate-marquee items-center gap-[10vw] pr-[30vw] min-w-full group-hover:[animation-play-state:paused]">
          {messages.map((msg, idx) => (
            <span 
              key={idx} 
              className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white drop-shadow-[3px_3px_0_#E11D48]"
            >
              {msg}
            </span>
          ))}
        </div>
        {/* Duplicate for seamless infinite scrolling */}
        <div 
          aria-hidden="true" 
          className="flex shrink-0 animate-marquee items-center gap-[30vw] pr-[30vw] min-w-full group-hover:[animation-play-state:paused]"
        >
          {messages.map((msg, idx) => (
            <span 
              key={`dup-${idx}`} 
              className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white drop-shadow-[3px_3px_0_#E11D48] mt-2"
            >
              {msg}
            </span>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `}} />
    </div>
  );
}
