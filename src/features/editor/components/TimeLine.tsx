'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { editorStore } from '../lib/editor.store';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

const PIXELS_PER_SECOND = 100;

type DragTarget = 'playhead' | 'in' | 'out' | null;

const TimeLine = () => {
  const duration = useEditorStore((s) => s.duration);
  const currentTime = useEditorStore((s) => s.currentTime);
  const inPoint = useEditorStore((s) => s.inPoint);
  const outPoint = useEditorStore((s) => s.outPoint);
  const zoom = useEditorStore((s) => s.zoom);
  const scrollLeft = useEditorStore((s) => s.scrollLeft);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<DragTarget>(null);
  const wasPlaying = useRef(false);
  const mouseXRef = useRef(0);
  const autoScrollRef = useRef(0);

  const pps = PIXELS_PER_SECOND * zoom;

  const totalWidth = Math.max(duration * pps, 600);

  const timeToX = (time: number) => time * pps;

  const xToTime = useCallback(
    (clientX: number): number => {
      if (!viewportRef.current || duration === 0) return 0;

      const rect = viewportRef.current.getBoundingClientRect();
      const x = Math.max(0, clientX - rect.left + scrollLeft);
      return Math.max(0, Math.min(duration, x / pps));
    },
    [duration, pps, scrollLeft],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.shiftKey) {
        const next = scrollLeft + e.deltaY;
        editorStore.setScrollLeft(next);
        el.scrollLeft = next;
      } else {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        editorStore.setZoom(zoom * factor);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, scrollLeft]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    editorStore.setScrollLeft(e.currentTarget.scrollLeft);
  };

  useEffect(() => {
    if (duration === 0) return;
    const frame = requestAnimationFrame(() => {
      if (!viewportRef.current) return;
      const viewportWidth = viewportRef.current.getBoundingClientRect().width;
      if (viewportWidth === 0) return;
      const fitZoom = viewportWidth / (duration * PIXELS_PER_SECOND);
      editorStore.setZoom(fitZoom);
    });
    return () => cancelAnimationFrame(frame);
    // if (!viewportRef.current || duration === 0) return;
    // const viewportWidth = viewportRef.current.getBoundingClientRect().width;
    // const fitZoom = viewportWidth / (duration * PIXELS_PER_SECOND);
    // editorStore.setZoom(fitZoom);
  }, [duration]);

  const startDrag = (e: React.MouseEvent, target: DragTarget) => {
    e.stopPropagation();

    wasPlaying.current = editorStore.getState().playing;

    editorStore.player?.pause();
    dragTarget.current = target;
    startAutoscroll();
  };

  const startAutoscroll = () => {
    const EDGE_ZONE = 40;
    const MAX_SPEED = 5;

    const loop = () => {
      const el = viewportRef.current;
      if (!el || !dragTarget.current) return;

      const rect = el.getBoundingClientRect();
      const mouseX = mouseXRef.current;

      const distFromRight = rect.right - mouseX;
      const distFromLeft = mouseX - rect.left;

      let delta = 0;

      if (distFromRight < EDGE_ZONE) {
        delta = Math.round(MAX_SPEED * (1 - distFromRight / EDGE_ZONE));
      } else if (distFromLeft < EDGE_ZONE) {
        delta = -Math.round(MAX_SPEED * (1 - distFromLeft / EDGE_ZONE));
      }

      if (delta !== 0) {
        el.scrollLeft += delta;
        editorStore.setScrollLeft(el.scrollLeft);
      }

      autoScrollRef.current = requestAnimationFrame(loop);
    };

    autoScrollRef.current = requestAnimationFrame(loop);
  };

  const stopAutoScroll = () => {
    cancelAnimationFrame(autoScrollRef.current);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;

      const target = dragTarget.current;
      if (!target) return;

      const time = xToTime(e.clientX);

      if (target === 'playhead') {
        editorStore.setCurrentTime(time);
        editorStore.player?.seek(time);
      } else if (target === 'in') {
        editorStore.setInPoint(time);
      } else if (target === 'out') {
        editorStore.setOutPoint(time);
      }
    };

    const onMouseUp = () => {
      if (dragTarget.current === 'playhead' && wasPlaying.current) {
        editorStore.player?.play();
      }
      stopAutoScroll();
      dragTarget.current = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [xToTime]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'i' || e.key === 'I') {
        editorStore.setInPoint(editorStore.getState().currentTime);
      }
      if (e.key === 'o' || e.key === 'O') {
        editorStore.setOutPoint(editorStore.getState().currentTime);
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        const { currentTime, duration } = editorStore.getState();
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        const step = e.ctrlKey ? 5 : e.shiftKey ? 0.1 : 1;
        const next = Math.max(
          0,
          Math.min(duration, currentTime + direction * step),
        );

        editorStore.setCurrentTime(next);
        editorStore.player?.seek(next);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    startDrag(e, 'playhead');
    const time = xToTime(e.clientX);
    editorStore.setCurrentTime(time);
    editorStore.player?.seek(time);
  };

  const ticks = () => {
    if (duration === 0) return null;

    const secondsPerTick = pps >= 200 ? 1 : pps >= 50 ? 5 : pps >= 20 ? 10 : 30;
    const marks = [];

    for (let t = 0; t < duration; t += secondsPerTick) {
      const isMajor = t % (secondsPerTick * 5) === 0;

      marks.push(
        <div
          key={t}
          className='absolute flex flex-col items-center'
          style={{ left: timeToX(t) }}
        >
          {isMajor && (
            <span
              className={`text-gray-500 text-[10px] mb-0.5 ${isMajor ? 'block' : 'hidden'}`}
            >
              {formatTime(t)}
            </span>
          )}
          <div
            className={`w-px ${isMajor ? 'h-3 bg-gray-400' : 'h-2 bg-gray-600'}`}
          />
        </div>,
      );
    }

    return marks;
  };

  const playheadX = timeToX(currentTime);
  const inX = inPoint !== null ? timeToX(inPoint) : null;
  const outX = outPoint !== null ? timeToX(outPoint) : null;

  return (
    <div className='mt-6 w-full max-w-4xl select-none'>
      <div className='mb-1 flex items-center gap-3 text-xs text-gray-500'>
        <span>Zoom: {zoom.toFixed(1)}</span>
        <span className='text-gray-700'>
          Scroll with mousewheel - Shift+scroll to pan
        </span>
      </div>

      <div
        ref={viewportRef}
        className='overflow-x-auto'
        onScroll={handleScroll}
      >
        <div style={{ width: totalWidth, position: 'relative' }}>
          <div className='relative h-6 mb-1'>{ticks()}</div>

          <div
            className='relative h-4 rounded bg-neutral-800 cursor-pointer'
            onMouseDown={handleTrackMouseDown}
          >
            {inX !== null && outX !== null && (
              <div
                className='absolute top-0 bottom-0 bg-blue-500 opacity-25'
                style={{ left: inX, width: outX - inX }}
              />
            )}

            {inX !== null && (
              <div
                className='absolute top-0 bottom-0 w-0.5 bg-green-400 cursor-ew-resize'
                style={{ left: inX }}
                onMouseDown={(e) => startDrag(e, 'in')}
              >
                <div className='absolute -top-2 left-0 w-3 h-3 bg-green-400 rounded-sm' />
              </div>
            )}

            {outX !== null && (
              <div
                className='absolute top-0 bottom-0 w-0.5 bg-red-400 cursor-ew-resize'
                style={{ left: outX }}
                onMouseDown={(e) => startDrag(e, 'out')}
              >
                <div className='absolute -top-2 right-0 w-3 h-3 bg-red-400 rounded-sm' />
              </div>
            )}

            <div
              className='absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-10'
              style={{ left: playheadX }}
              onMouseDown={(e) => startDrag(e, 'playhead')}
            >
              <div className='absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white' />
            </div>
          </div>

          <div className='relative h-6 mt-1'>
            <div
              className='absolute -translate-y-1/2 text-[11px] font-mono text-gray-300 bg-neutral-900 px-1.5 py-0.5 rounded whitespace-nowrap'
              style={{ left: playheadX }}
            >
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {(inPoint !== null || outPoint !== null) && (
        <div className='mt-2 flex gap-4 text-[11px] font-mono text-gray-400'>
          {inPoint !== null && (
            <span className='flex items-center gap-1'>
              <span className='text-green-400'>IN</span>
              {formatTime(inPoint)}
              <button
                className='ml-1 text-gray-600 hover:text-gray-300'
                onClick={() => editorStore.setInPoint(null)}
              >
                X
              </button>
            </span>
          )}
          {outPoint !== null && (
            <span className='flex items-center gap-1'>
              <span className='text-green-400'>OUT</span>
              {formatTime(outPoint)}
              <button
                className='ml-1 text-gray-600 hover:text-gray-300'
                onClick={() => editorStore.setOutPoint(null)}
              >
                X
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeLine;
