export default function ScorePill({label,value,invert=false}:{label:string,value:number,invert?:boolean}){
 const good=invert?value<45:value>=70, mid=invert?value<70:value>=45;
 return <div className="scorePill"><span>{label}</span><b className={good?"good":mid?"mid":"bad"}>{value}</b></div>
}