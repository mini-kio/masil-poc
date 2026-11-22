import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { audioFor, scenarios } from '../src/scenarios.js';
import { callLineAt, isConnected } from '../src/familyCall.js';
import { createDaughterFigure } from '../src/daughter.js';
import { seatGrandmother } from '../src/grandmother.js';

const recordings=JSON.parse(readFileSync(new URL('../src/waveforms.json',import.meta.url)));
const length=name=>recordings[name].seconds;

test('sharing the news leads to a reaction, dial, ring, pickup and conversation',()=>{
  const interest=scenarios.interest,call=interest.nextCall;
  assert.equal(interest.shared.family.actions[0].to,'nextCall');
  assert.equal(interest.private.family,undefined);
  const order=['delivered','noticed','dialing','ringing','answered','talking','listening'];
  assert.deepEqual(call.lines.map(line=>line.callStage),order);
  assert.deepEqual(audioFor(call),call.lines.map(line=>line.audio));
  let t=0;
  for(const line of call.lines) {
    const seconds=length(line.audio);
    assert.ok(seconds>0 && recordings[line.audio].revision);
    assert.equal(callLineAt(call.lines,t+seconds/2,length),line);
    t+=seconds;
  }
  assert.equal(callLineAt(call.lines,t,length).callStage,'listening');
});

test('the two 3D handsets move to the ear at opposite ends of the ring',()=>{
  const room=new THREE.Scene(),portrait=new THREE.Scene();
  const pose=createDaughterFigure(portrait);
  const handset=portrait.getObjectByName('daughter-handset');
  const state={stage:'dialing',speaking:false,audible:false};
  pose(state,0,.03,true);
  const tapping=handset.position.y;
  pose({...state,stage:'ringing'},1,.03,true);
  assert.ok(handset.position.y>tapping+.3);

  const grandma=seatGrandmother(room);
  const perf={line:'r',speaker:'전화벨',audio:false,ringing:true,onCall:isConnected('ringing')};
  grandma.update(9,1,true,perf);
  assert.equal(grandma.handset.visible,true);
  const reading=grandma.handset.position.y;
  grandma.update(9,2,true,{...perf,line:'a',speaker:'할머니',ringing:false,onCall:isConnected('answered')});
  assert.ok(grandma.handset.position.y>reading+.3);
});
