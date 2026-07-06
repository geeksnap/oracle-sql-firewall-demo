## Why

The Market demo currently frames search results around luxury assets (for example, Rolex watches), which does not match the intended investment-security narrative. We need the page to model investment instrument pricing so the SQLi/WAF/SQL Firewall demonstration is grounded in realistic market use cases.

## What Changes

- Replace Market page dataset framing from luxury collectibles to investment instruments and market-priced assets.
- Update Market search copy, labels, and examples to prioritize ticker and instrument-type lookup patterns.
- Support representative instrument groups and symbols in demo content: stocks (ORCL, MSFT, JPM), bonds (US Treasury bills/bonds and corporate bonds), ETFs (VOO, S&P 500 ETFs), crypto (BTC, ETH), and metals (gold, silver).
- Keep existing SQL injection educational flow and metadata discovery behavior, but align displayed business context and result semantics with investment markets.
- Remove reliance on WAF bypass hint rows in Market UX so the page reflects canonical market-search behavior.

## Capabilities

### New Capabilities
- `luminaforge-market-investment-pricing`: Defines Market demo behavior for searching and displaying investment instruments with market-price context across major asset classes.

### Modified Capabilities
- `luminaforge-market-column-discovery`: Adjusts Market-facing query guidance and display semantics so column-enumeration steps operate within investment-market context.
- `luminaforge-market-schema-discovery`: Adjusts schema-discovery flow messaging and table exploration framing to investment-market terminology.

## Impact

- Affected code: `luminaforge/src/app/market/page.tsx`, Market API route/query shaping, and any Market demo seed/query sources used for result cards.
- Affected specs: new Market investment-pricing capability plus deltas for Market schema/column discovery capabilities.
- Affected UX: Market labels, hints, and search examples shift from luxury products to investment instruments.
