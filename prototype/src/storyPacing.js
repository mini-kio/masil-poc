export function readChapter(tops, end, line) {
  const last = tops.length - 1;
  let index = 0;
  while (index < last && line >= tops[index + 1]) index++;

  const length = Math.max(1, (tops[index + 1] ?? end) - tops[index]);
  const fraction = Math.max(0, Math.min(1, (line - tops[index]) / length));
  return { index, fraction };
}

// Short utterances still get a little space on the scroll track.
export function captionEnds(beat) {
  const weights = beat.cues.map((cue, i) => {
    const next = beat.cues[i + 1]?.at ?? beat.seconds;
    return Math.max(2.2, next - cue.at);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let offset = 0;
  return weights.map(weight => (offset += weight) / total);
}

export function scrollCue(ends, fraction) {
  const index = ends.findIndex(end => fraction < end);
  return index < 0 ? ends.length - 1 : index;
}
