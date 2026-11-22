export const clamp01=v=>Math.max(0,Math.min(1,v));

// A wheel notch or one Page Down never qualifies. A sustained fling must cover
// well over one viewport within the same short window, in one direction.
export function scrollVelocity(y=0,time=0) {
  let samples=[{y,time}], sign=0;
  return (next,now,height)=>{
    const last=samples.at(-1);
    if (next===last.y) return false;
    const direction=Math.sign(next-last.y);
    if (direction!==sign || now-last.time>245) {
      samples=[{y:last.y,time:Math.max(last.time,now-170)}];
      sign=direction;
    }
    samples.push({y:next,time:now});
    while(samples.length>2 && now-samples[0].time>240) samples.shift();
    const distance=Math.abs(next-samples[0].y)/Math.max(height,1);
    const ms=Math.max(25,now-samples[0].time);
    return distance>=1.7 && distance*1000/ms>=7;
  };
}

export function captionLayout(day) {
  const beats=[],flat=[];
  for (const [index,beat] of day.entries()) {
    const first=flat.length;
    const weights=beat.cues.map((cue,i)=>Math.max(2.2,(beat.cues[i+1]?.at??beat.seconds)-cue.at));
    const total=weights.reduce((sum,n)=>sum+n,0);
    let offset=0;
    const ends=weights.map((weight,cue)=>{
      const start=offset/total;
      offset+=weight;
      const end=offset/total;
      flat.push({index,cue,middle:(start+end)/2,hold:Math.min(1250,570+beat.cues[cue].text.length*14)});
      return end;
    });
    beats.push({first,ends});
  }
  return {flat,beats};
}

export function scrollCue(beat,fraction) {
  const n=beat.ends.findIndex(end=>fraction<end);
  return n<0?beat.ends.length-1:n;
}

export function nextNarratedBeat(playing,target) {
  return playing<0?target:playing+Math.sign(target-playing);
}
