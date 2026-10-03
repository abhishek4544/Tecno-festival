'use client';

import { useEffect, useRef, useState } from 'react';

import { icon } from '@/components/icons';
import Button from '@/components/ui/buttons/Button';

const BACKGROUND_MUSIC_SRC = '/images/audios/dashain-mangal-dhoon.mp3';

export default function SoundToggleButton() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSoundOn, setIsSoundOn] = useState(false);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    function kickoff() {
      cleanup();
      const audio = audioRef.current;
      if (!audio || !audio.paused) return;
      audio
        .play()
        .then(() => setIsSoundOn(true))
        .catch(() => {});
    }

    function cleanup() {
      events.forEach((e) => window.removeEventListener(e, kickoff));
    }

    events.forEach((e) =>
      window.addEventListener(e, kickoff, { once: true, passive: true }),
    );

    return cleanup;
  }, []);

  async function handleToggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isSoundOn) {
      audio.pause();
      setIsSoundOn(false);
      return;
    }

    try {
      await audio.play();
      setIsSoundOn(true);
    } catch {
      // Playback can be blocked by the browser or fail if the file is missing.
      setIsSoundOn(false);
    }
  }

  return (
    <>
      <Button
        variant="glass"
        aria-pressed={isSoundOn}
        onClick={handleToggle}
        aria-label={isSoundOn ? 'Turn sound off' : 'Turn sound on'}
        className="h-10 w-10 rounded-[8px] p-0 md:h-[34px] md:w-[42px]"
      >
        <icon.voiceWave
          aria-hidden
          isAnimating={isSoundOn}
          className="size-[18px]"
        />
      </Button>
      <audio
        ref={audioRef}
        src={BACKGROUND_MUSIC_SRC}
        loop
        preload="auto"
        onEnded={() => setIsSoundOn(false)}
      />
    </>
  );
}
