export const HANDOFF = .333;
export const ROOM_GONE = .398;
export const CLOSEUP = .286;
export const stages = ['inbox','payment','address','profile','saved'];
export function easeBetween(value,from,to) {
  const t=Math.max(0,Math.min(1,(value-from)/(to-from)));
  return t*t*(3-2*t);
}
export function phoneScroll(p) {
  return easeBetween(p,.570,.601)+easeBetween(p,.671,.702)
    +easeBetween(p,.772,.803)+easeBetween(p,.886,.917);
}
