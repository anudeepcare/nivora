-- NIVORA V65 multi-asset portfolio upgrade.
alter table public.portfolio_positions
  add column if not exists asset_type text not null default 'EQUITY'
  check (asset_type in ('EQUITY','CRYPTO','CASH'));

alter table public.portfolio_positions
  add column if not exists currency text;

-- Existing rows remain EQUITY. For CASH, symbol is the currency (for example USD),
-- shares stores the cash amount, and avg_cost is fixed at 1.
update public.portfolio_positions set asset_type='EQUITY' where asset_type is null;

create index if not exists idx_portfolio_positions_user_asset_type
  on public.portfolio_positions(user_id,asset_type);
