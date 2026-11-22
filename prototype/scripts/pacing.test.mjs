import test from 'node:test';
import assert from 'node:assert/strict';
import { captionLayout, nextNarratedBeat, scrollCue, scrollVelocity } from '../src/storyPacing.js';
import { HANDOFF, CLOSEUP, ROOM_GONE, phoneScroll } from '../src/deviceTimeline.js';

test('a page key or ordinary scrolling through multiple rooms keeps every scene',()=>{
  const wheel=scrollVelocity(0,0);
  for(let n=1;n<=12;n++) assert.equal(wheel(n*180,n*120,800),false);
  assert.equal(wheel(2960,2100,800),false);
  let beat=2; const sequence=[];
  while(beat!==6) {beat=nextNarratedBeat(beat,6);sequence.push(beat);}
  assert.deepEqual(sequence,[3,4,5,6]);
});

test('a single large fling qualifies and a direction change starts a fresh measurement',()=>{
  const wheel=scrollVelocity(0,0);
  assert.equal(wheel(400,42,800),false);
  assert.equal(wheel(885,95,800),false);
  assert.equal(wheel(1520,158,800),true);
  assert.equal(wheel(1250,210,800),false);
});

test('short sounds have a readable interval in the silent story',()=>{
  const layout=captionLayout([{seconds:8,cues:[{at:0,text:'쿵'},{at:.5,text:'괜찮다.'},{at:2,text:'어디 부딪히셨어요?'}]}]);
  const [beat]=layout.beats;
  assert.equal(scrollCue(beat,.10),0);
  assert.equal(scrollCue(beat,.32),1);
  assert.equal(scrollCue(beat,1),2);
});

test('the camera finishes its approach before handoff; phone settings reverse with scrolling',()=>{
  assert.ok(CLOSEUP<HANDOFF && HANDOFF<ROOM_GONE);
  const samples=[.55,.63,.73,.85,.95];
  assert.deepEqual(samples.map(phoneScroll),[0,1,2,3,4]);
  assert.deepEqual(samples.toReversed().map(phoneScroll),[4,3,2,1,0]);
});
