# AURYN V9.9.6.2 — Validation Throughput Tuning

Changes only queue throughput:
- GitHub schedule: every 10 minutes (was 15)
- bounded sequential burst: up to 10 stocks (was 4; script cap was 5)
- spacing: 6 seconds between worker calls (was 12)
- existing Supabase 42/min background provider governor remains authoritative
- V9.9.6.1 RUN_NOT_FOUND quarantine remains
- one symbol per durable job remains
- no CIO/research/universe/UX changes
- vercel.json remains {}
