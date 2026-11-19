# Portfolio purchases: allow multiple lots per ticker

Some existing Supabase databases have a legacy unique index named
`portfolio_positions_user_account_symbol_uidx` on
`(user_id, account_name, symbol)`. Both Add position and Add another purchase
insert a new position ID. On databases with this index, PostgreSQL rejects
a second purchase even if the app already groups existing lots in Holdings.

Apply the new `20261119033347_allow_portfolio_purchase_lots.sql` migration to the
Supabase database connected to the affected deployment. To fix an existing
r20 deployment without redeploying the app, run only this statement in its
SQL Editor:

```sql
DROP INDEX IF EXISTS public.portfolio_positions_user_account_symbol_uidx;
```

This does not update, delete, or merge any positions, change RLS, or remove the
UUID primary key. The owner lookup index remains. If this is a fresh database
without the legacy index, it is a no-op. Do not apply unrelated migrations
just to make this change.

To verify the old index is absent without reading holdings:

```sql
SELECT to_regclass('public.portfolio_positions_user_account_symbol_uidx') IS NULL
  AS multiple_lot_index_block_removed;
```

On an isolated test account, add two unequal lots of the same ticker and
reload Holdings. The app should display one ticker with the summed quantity
and quantity-weighted average, and the purchase manager should show both
original lots. Do not test by adding sample purchases to a real portfolio.
