(() => {
  'use strict';

  const roadmap = document.querySelector('#roadmap');
  if (!roadmap) return;

  const steps = [...roadmap.querySelectorAll('.roadmap-step')];
  const links = [...roadmap.querySelectorAll('.roadmap-nav a')];
  const scenes = steps.map(step => step.querySelector('.roadmap-scene'));
  const frames = roadmap.querySelector('.roadmap-frames');
  const counter = roadmap.querySelector('.roadmap-counter');
  const wide = window.matchMedia('(min-width: 860px) and (min-height: 530px)');
  let active = -1;
  let queued = false;

  function choose(index) {
    if (index === active) return;
    active = index;
    steps.forEach((step, i) => {
      const current = i === index;
      step.classList.toggle('is-current', current);
      scenes[i].classList.toggle('is-current', current);
      if (current) links[i].setAttribute('aria-current', 'step');
      else links[i].removeAttribute('aria-current');
    });
    const page = String(index + 1).padStart(2, '0');
    counter.textContent = page + ' / ' + String(steps.length).padStart(2, '0');
    roadmap.style.setProperty('--roadmap-progress', (index + 1) / steps.length);
  }

  function readPosition() {
    queued = false;
    const readingLine = Math.min(window.innerHeight * .46, 340);
    let index = 0;
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].getBoundingClientRect().top > readingLine) break;
      index = i;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      index = steps.length - 1;
    }
    choose(index);
  }

  function scheduleRead() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(readPosition);
  }

  function arrange() {
    // Each scene has one source in the HTML. Compact screens keep it with its own step.
    scenes.forEach((scene, i) => {
      const destination = wide.matches ? frames : steps[i].querySelector('.step-content');
      if (scene.parentElement !== destination) destination.append(scene);
    });
    roadmap.classList.toggle('roadmap-pinned', wide.matches);
    readPosition();
  }

  arrange();
  wide.addEventListener('change', arrange);
  window.addEventListener('scroll', scheduleRead, { passive: true });
  window.addEventListener('resize', scheduleRead, { passive: true });
  window.addEventListener('pageshow', scheduleRead);
  roadmap.addEventListener('toggle', scheduleRead, true);
})();
