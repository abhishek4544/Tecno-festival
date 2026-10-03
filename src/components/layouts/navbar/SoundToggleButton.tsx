'use client';

import { useEffect, useRef, useState } from 'react';

import { icon } from '@/components/icons';
import Button from '@/components/ui/buttons/Button';

const BACKGROUND_MUSIC_SRC = '/images/audios/dashain-mangal-dhoon.mp3';

// Browsers only allow audible autoplay after a user gesture, so if the
// attempt on load is blocked we retry on the first interaction. Mobile
// browsers only grant that permission on touchend/click, not touchstart.
const INTERACTION_EVENTS = ['click', 'touchend', 'keydown'] as const;

export default function SoundToggleButton() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSoundOn, setIsSoundOn] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function removeListeners() {
      INTERACTION_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleFirstInteraction),
      );
    }

    function handleFirstInteraction(event: Event) {
      // Let the toggle button's own click decide whether to play.
      if ((event.target as Element).closest?.('[data-sound-toggle]')) {
        removeListeners();
        return;
      }
      if (!audio?.paused) {
        removeListeners();
        return;
      }
      // Keep listening until playback actually starts.
      audio
        .play()
        .then(removeListeners)
        .catch(() => {});
    }

    audio.play().catch(() => {
      INTERACTION_EVENTS.forEach((event) =>
        window.addEventListener(event, handleFirstInteraction, {
          passive: true,
        }),
      );
    });

    return removeListeners;
  }, []);

  function handleToggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // Playback can be blocked by the browser or fail if the file is missing.
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  return (
    <>
      <Button
        variant="glass"
        data-sound-toggle
        aria-pressed={isSoundOn}
        onClick={handleToggle}
        aria-label={isSoundOn ? 'Turn sound off' : 'Turn sound on'}
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 size-[48px] rounded-full p-0 shadow-lg md:static md:h-[34px] md:w-[42px] md:rounded-[8px] md:shadow-none"
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
        onPlay={() => setIsSoundOn(true)}
        onPause={() => setIsSoundOn(false)}
      />
    </>
  );
}
