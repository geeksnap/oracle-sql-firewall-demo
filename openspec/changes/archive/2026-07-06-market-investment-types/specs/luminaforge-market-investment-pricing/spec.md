## ADDED Requirements

### Requirement: Market Explorer SHALL present investment instruments instead of luxury assets
The Market Explorer domain model SHALL represent investment instruments and market-priced assets across stocks, bonds, ETFs, cryptocurrencies, and precious metals.

#### Scenario: Search results use investment categories
- **WHEN** a user opens the `/market` page and performs a normal search
- **THEN** returned rows SHALL use investment-oriented categories (for example `STOCK`, `BOND`, `ETF`, `CRYPTO`, `METAL`) instead of luxury product categories
- **AND** result labels SHALL represent investment instrument names or symbols

### Requirement: Market Explorer SHALL support ticker and instrument-type lookup
The search input and API behavior SHALL support lookups by ticker symbol and investment type keywords.

#### Scenario: Ticker lookup
- **WHEN** a user searches for a ticker such as `ORCL`, `MSFT`, `JPM`, `VOO`, `BTC`, or `ETH`
- **THEN** the page SHALL return matching instrument rows with corresponding market-price values

#### Scenario: Instrument-type lookup
- **WHEN** a user searches for an instrument group such as `bonds`, `etf`, `crypto`, `gold`, or `silver`
- **THEN** the page SHALL return matching rows within that investment type where data exists

### Requirement: Market Explorer SHALL communicate a market-pricing demo context
The Market Explorer page copy SHALL describe the module as investment market search and pricing context.

#### Scenario: Header and helper text align to investment context
- **WHEN** a user views the `/market` page
- **THEN** page title, description, and search placeholder SHALL refer to investment search and instrument pricing rather than luxury collectibles
