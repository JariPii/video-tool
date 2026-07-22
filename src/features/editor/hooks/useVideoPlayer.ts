import { useRef, useState } from 'react';

export const useVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  const play = async () => {
    await videoRef.current?.play();
  };

  const pause = () => {
    videoRef.current?.pause();
  };

  const seek = (time: number) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleLoadedMetaData = () => {
    if (!videoRef.current) return;

    setDuration(videoRef.current.duration);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    setCurrentTime(videoRef.current.currentTime);
  };

  const handlePlay = () => {
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
  };

  return {
    videoRef,
    duration,
    currentTime,
    playing,
    play,
    pause,
    seek,
    handleLoadedMetaData,
    handleTimeUpdate,
    handlePlay,
    handlePause,
  };
};
