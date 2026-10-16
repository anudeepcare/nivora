/** Save only after resolving the owning list required by the database schema. */
export async function saveWatchlistSymbol(client, userId, symbol) {
  const found = await client.from('watchlists').select('id').eq('user_id', userId).limit(1).maybeSingle();
  if (found.error) throw found.error;
  let list = found.data;
  if (!list) {
    const created = await client.from('watchlists').insert({user_id:userId,name:'My Watchlist'}).select('id').single();
    if (created.error) throw created.error;
    list = created.data;
  }
  if (!list?.id) throw new Error('Watchlist could not be created.');
  const saved = await client.from('watchlist_items').upsert({watchlist_id:list.id,user_id:userId,symbol},{onConflict:'watchlist_id,symbol'});
  if (saved.error) throw saved.error;
}
