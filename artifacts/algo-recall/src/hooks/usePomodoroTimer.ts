import { useState, useEffect, useRef } from 'react';

export function usePomodoroTimer(initialFocusMinutes: number = 25, initialBreakMinutes: number = 5) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(initialFocusMinutes * 60);
  const [isRunning, setIsActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setTimeLeft(mode === "focus" ? initialFocusMinutes * 60 : initialBreakMinutes * 60);
  }, [initialFocusMinutes, initialBreakMinutes, mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      playBeep();
      setIsActive(false);
      setMode(prev => prev === "focus" ? "break" : "focus");
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const playBeep = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  };

  const toggleTimer = () => setIsActive(!isRunning);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? initialFocusMinutes * 60 : initialBreakMinutes * 60);
  };
  const setTimerMode = (newMode: "focus" | "break") => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === "focus" ? initialFocusMinutes * 60 : initialBreakMinutes * 60);
  };

  const progress = mode === "focus" 
    ? ((initialFocusMinutes * 60 - timeLeft) / (initialFocusMinutes * 60)) * 100
    : ((initialBreakMinutes * 60 - timeLeft) / (initialBreakMinutes * 60)) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    mode,
    timeLeft,
    formattedTime,
    isRunning,
    progress,
    toggleTimer,
    resetTimer,
    setTimerMode
  };
}
