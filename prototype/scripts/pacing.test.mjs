import test from 'node:test';
import assert from 'node:assert/strict';
import { captionEnds, readChapter, scrollCue } from '../src/storyPacing.js';
import { CLOSEUP, HANDOFF, ROOM_GONE, phoneScroll } from '../src/deviceTimeline.js';

test('the same scroll position selects the same scene and caption in either direction', () => {
  const tops = [100, 340, 700, 900];
  const ends = captionEnds({ seconds: 8, cues: [{ at: 0 }, { at: 2 }, { at: 5 }] });
  const sample = y => {
    const { index, fraction } = readChapter(tops, 1300, y);
    return [index, scrollCue(ends, fraction)];
  };
  const stops = [110, 245, 340, 620, 700, 870, 900, 1100];
  assert.deepEqual(stops.map(sample), stops.toReversed().map(sample).reverse());
  assert.deepEqual([110, 870, 340].map(sample), [[0, 0], [2, 2], [1, 0]]);
});

test('anchors start at zero progress and overscroll stays within the first or last stop', () => {
  const tops = [100, 500, 900];
  assert.deepEqual(readChapter(tops, 1300, -20), { index: 0, fraction: 0 });
  assert.deepEqual(readChapter(tops, 1300, 500), { index: 1, fraction: 0 });
  assert.deepEqual(readChapter(tops, 1300, 700), { index: 1, fraction: .5 });
  assert.deepEqual(readChapter(tops, 1300, 2000), { index: 2, fraction: 1 });
});

test('short audio cues also have space on the silent scroll track', () => {
  const ends = captionEnds({ seconds: 8, cues: [{ at: 0 }, { at: .5 }, { at: 2 }] });
  assert.equal(scrollCue(ends, .10), 0);
  assert.equal(scrollCue(ends, .32), 1);
  assert.equal(scrollCue(ends, 1), 2);
});

test('the tablet handoff and family settings reverse with scrolling', () => {
  assert.ok(CLOSEUP < HANDOFF && HANDOFF < ROOM_GONE);
  const stops = [.55, .63, .73, .85, .95];
  assert.deepEqual(stops.map(phoneScroll), [0, 1, 2, 3, 4]);
  assert.deepEqual(stops.toReversed().map(phoneScroll), [4, 3, 2, 1, 0]);
});
