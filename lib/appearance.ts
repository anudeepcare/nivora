export const APPEARANCE_KEY='auryn-appearance-v1';
export const accents={blue:{label:'AURYN Blue',solid:'#2163d5',light:'#2163d5',dark:'#8bb5ff'},teal:{label:'Ocean',solid:'#006d73',light:'#00777d',dark:'#61d3cc'},violet:{label:'Iris',solid:'#7046cf',light:'#7046cf',dark:'#b9a2ff'},rose:{label:'Rose',solid:'#ad2f62',light:'#ad2f62',dark:'#ffa1c4'}} as const;
export type Appearance={accent:keyof typeof accents;density:'comfortable'|'compact'};
export const DEFAULT_APPEARANCE:Appearance={accent:'blue',density:'comfortable'};
export function cleanAppearance(value:unknown):Appearance{const x=value&&typeof value==='object'?value as Record<string,unknown>:{};return {accent:typeof x.accent==='string'&&Object.hasOwn(accents,x.accent)?x.accent as Appearance['accent']:'blue',density:x.density==='compact'?'compact':'comfortable'};}
