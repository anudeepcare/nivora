export function nextSearchAction(key,index,count){
  if(key==='Escape')return{action:'cancel',index:-1};
  if(!Number.isInteger(count)||count<=0)return{action:'none',index:-1};
  if(key==='ArrowDown')return{action:'focus',index:(Number.isInteger(index)?index:-1)+1>=count?0:(Number.isInteger(index)?index:-1)+1};
  if(key==='ArrowUp')return{action:'focus',index:!Number.isInteger(index)||index<=0?count-1:index-1};
  if(key==='Enter'&&Number.isInteger(index)&&index>=0&&index<count)return{action:'select',index};
  return{action:'none',index:Number.isInteger(index)?index:-1};
}
