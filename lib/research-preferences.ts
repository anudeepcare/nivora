import type {ResearchStyle} from './decision-research';
export type ResearchPreferences={style:ResearchStyle;detail:'essential'|'advanced';horizon:'long'|'swing';};
export const DEFAULT_RESEARCH_PREFERENCES:ResearchPreferences={style:'Balanced',detail:'essential',horizon:'long'};
export function sanitizeResearchPreferences(raw:unknown):ResearchPreferences{
 const x=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 return {style:['Balanced','Value','Growth','Income','Quality'].includes(String(x.style))?x.style as ResearchStyle:'Balanced',detail:x.detail==='advanced'?'advanced':'essential',horizon:x.horizon==='swing'?'swing':'long'};
}
