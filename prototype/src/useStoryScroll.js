import { useEffect, useState } from 'react';
import { day, places } from './day.js';
import { captionEnds, readChapter, scrollCue } from './storyPacing.js';
import { CLOSEUP, HANDOFF, ROOM_GONE, easeBetween } from './deviceTimeline.js';

const lastBeat = day.length - 1;
const subtitles = day.map(captionEnds);
const roomStarts = places.map((_, i) => day.findIndex(beat => beat.place === i));

function paintApproach(stage, progress) {
  const spread = easeBetween(progress, .10, .26);
  const style = stage.style;
  stage.dataset.transition = String(progress > 0);
  style.setProperty('--story-out', 1 - easeBetween(progress, 0, .058));
  style.setProperty('--room-out', 1 - easeBetween(progress, HANDOFF, ROOM_GONE));
  style.setProperty('--frame-scale', .91 + .09 * spread);
  style.setProperty('--frame-angle', (-2 + 2 * spread) + 'deg');
  style.setProperty('--frame-edge', (1 - spread) * Math.min(10, innerWidth * .0065) + 'px');
  style.setProperty('--frame-visibility', 1 - spread);
  style.setProperty('--paper-tone', easeBetween(progress, .257, .33) * 100 + '%');
  style.setProperty('--extra-width', 17 * spread + '%');
  style.setProperty('--world-shift', 12.5 * spread + '%');
}

export default function useStoryScroll({ root, stage, controller, position, portal, linear }) {
  const [reading, setReading] = useState({ index: 0, cue: 0, bridge: false, wakeShown: false });

  useEffect(() => {
    const element = stage.current;
    const stops = Array.from(root.current.querySelectorAll(linear ? '.story-caption, .devices-linear' : '.chapter-stop'));
    let tops, end, readingLine;
    let frame = 0;

    function read() {
      frame = 0;
      const { index: stop, fraction } = readChapter(tops, end, scrollY + readingLine);
      const bridge = stop === day.length;
      const index = Math.min(stop, lastBeat);
      const cue = scrollCue(subtitles[index], bridge ? 1 : fraction);
      const wakeShown = index === 0 && fraction > .28;
      const room = day[index].place;
      const size = (roomStarts[room + 1] ?? day.length) - roomStarts[room];
      const journey = bridge ? 1 : (room + (index - roomStarts[room] + fraction) / size) / places.length;
      element.style.setProperty('--journey', journey);

      let progress = 0;
      if (!linear && bridge) progress = .045 + .955 * fraction;
      else if (!linear && index === lastBeat) progress = .045 * easeBetween(fraction, .93, 1);

      const device = portal.current;
      if (progress > 0 || device.progress > 0) {
        device.progress = progress;
        if (!progress) device.source = null;
        paintApproach(element, progress);
        // During the handoff the renderer projects the tablet and paints its successor in the same frame.
        if (!progress || !device.webgl || (progress >= ROOM_GONE && device.owner === 'screen')) device.paint();
      }
      position.current = progress > 0
        ? lastBeat + 2 * easeBetween(progress, 0, CLOSEUP)
        : Math.min(lastBeat, index + fraction);
      controller.current?.setProgress(position.current);

      setReading(previous => previous.index === index && previous.cue === cue && previous.bridge === bridge
        && previous.wakeShown === wakeShown ? previous : { index, cue, bridge, wakeShown });
    }

    function request() {
      if (!frame) frame = requestAnimationFrame(read);
    }

    function measure() {
      const header = document.querySelector('.masthead').offsetHeight;
      readingLine = header + (linear ? Math.min(185, innerHeight * .26) : 3);
      tops = stops.map(stop => stop.getBoundingClientRect().top + scrollY);
      end = tops.at(-1) + stops.at(-1).offsetHeight - (linear ? 0 : element.offsetHeight);
      request();
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root.current);
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pageshow', measure);
    };
  }, [root, stage, controller, position, portal, linear]);
  return reading;
}
