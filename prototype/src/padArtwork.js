const width=1152, height=720;
let logo;

// Both the mesh and the travelling screen use this same canvas drawing.
export function drawPad(canvas,shared,onChange) {
  canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d');
  function paint() {
    ctx.setTransform(1.5,0,0,1.5,0,0);
    ctx.fillStyle='#f8f1df'; ctx.fillRect(0,0,768,480);
    if (logo?.naturalWidth) {
      ctx.save(); ctx.globalCompositeOperation='multiply'; ctx.drawImage(logo,44,35,32,35); ctx.restore();
    }
    ctx.fillStyle='#294537'; ctx.font='bold 32px sans-serif'; ctx.fillText('마실 패드',88,64);
    ctx.fillStyle='#57745e'; ctx.font='bold 22px sans-serif'; ctx.fillText(shared?'가족에게 전한 한마디':'어르신 화면',44,153);
    ctx.fillStyle='#263e30'; ctx.font='bold 50px serif';
    ctx.fillText(shared?'“담에 오면 내하고':'할머니,',44,234);
    ctx.fillText(shared?'같이 보자 캐라.”':'듣고 있어요.',44,302);
    ctx.fillStyle='#506456'; ctx.font='24px sans-serif';
    ctx.fillText(shared?'할머니가 허락하신 드라마 이야기':'마실과 나누는 대화',44,399);
  }
  if (!logo) { logo=new Image(); logo.src=import.meta.env.BASE_URL+'masil-mark.webp'; }
  paint();
  if (!logo.complete) logo.addEventListener('load',()=>{paint();onChange?.();},{once:true});
}
