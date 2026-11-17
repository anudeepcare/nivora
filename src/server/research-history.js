const positiveNumber = value => {
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

export function normalizeResearchHistory(payload,{asOf=new Date(),requireAdjusted=false}={}) {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  if(!(asOf instanceof Date)||!Number.isFinite(asOf.getTime()))return null;
  const asOfDay=asOf.toISOString().slice(0,10);
  const rows = payload.map(row => {
    const close = positiveNumber(requireAdjusted ? row?.adjusted_close : row?.adjusted_close ?? row?.close);
    if (typeof row?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || close === null) return null;
    const date=new Date(`${row.date}T00:00:00Z`);
    if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==row.date||row.date>asOfDay)return null;
    const rawVolume=row?.volume,parsedVolume=rawVolume===null||rawVolume===undefined||rawVolume===''?null:Number(rawVolume);
    return { date: row.date, close, volume:Number.isFinite(parsedVolume)&&parsedVolume>=0?parsedVolume:null };
  });
  if(rows.includes(null))return null;
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  return new Set(rows.map(row=>row.date)).size===rows.length?rows:null;
}
