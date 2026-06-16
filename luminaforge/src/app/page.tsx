import { GlassCard } from "@/components/GlassCard";
import { PortfolioGlobe } from "@/components/PortfolioGlobe";
import { PriceTicker } from "@/components/PriceTicker";
import Link from "next/link";

const PORTFOLIO_SUMMARY = [
  { label: "Total Value",  value: "$14,823,740", delta: "+4.1%",  up: true  },
  { label: "Day P&L",      value: "+$584,920",   delta: "+4.11%", up: true  },
  { label: "Holdings",     value: "12",           delta: "assets", up: true  },
  { label: "Ann. Yield",   value: "8.7%",         delta: "YTD",    up: true  },
];

const QUICK_HOLDINGS = [
  { symbol: "AAPL",  qty: 150, avg: 185.50,  price: 187.23, up: true  },
  { symbol: "NVDA",  qty:  80, avg: 620.00,  price: 924.60, up: true  },
  { symbol: "ORCL",  qty: 200, avg: 138.30,  price: 141.50, up: true  },
  { symbol: "MSFT",  qty: 120, avg: 380.25,  price: 415.20, up: true  },
  { symbol: "BTC",   qty:   2, avg: 58200,   price: 68450,  up: true  },
  { symbol: "ETH",   qty:  18, avg: 3100,    price: 3620,   up: true  },
  { symbol: "TSLA",  qty:  60, avg: 195.80,  price: 172.40, up: false },
  { symbol: "GS",    qty:  75, avg: 460.10,  price: 478.30, up: true  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-0">
      <PriceTicker />

      <div className="mx-auto w-full max-w-7xl px-6 py-6 flex flex-col gap-6">
        {/* Hero row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Globe */}
          <div className="lg:col-span-1">
            <PortfolioGlobe />
          </div>

          {/* Metrics + holdings */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PORTFOLIO_SUMMARY.map((kpi) => (
                <GlassCard key={kpi.label} gold className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{kpi.label}</p>
                  <p className="text-lg font-black gold-text">{kpi.value}</p>
                  <p className={`text-xs mt-1 font-medium ${kpi.up ? "text-green-400" : "text-red-400"}`}>
                    {kpi.delta}
                  </p>
                </GlassCard>
              ))}
            </div>

            {/* Holdings table */}
            <GlassCard className="flex-1">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Current Holdings</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-600 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="pb-2 font-medium">Symbol</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Avg Cost</th>
                    <th className="pb-2 font-medium text-right">Current</th>
                    <th className="pb-2 font-medium text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {QUICK_HOLDINGS.map((h) => {
                    const pnl = (h.price - h.avg) * h.qty;
                    return (
                      <tr key={h.symbol} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                        <td className="py-2 font-bold text-slate-200">{h.symbol}</td>
                        <td className="py-2 text-right text-slate-400">{h.qty}</td>
                        <td className="py-2 text-right text-slate-400">${h.avg}</td>
                        <td className="py-2 text-right gold-text">${h.price}</td>
                        <td className={`py-2 text-right font-semibold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>
          </div>
        </div>

        {/* Quick navigation cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: "/market", title: "Market Explorer", desc: "Search investment instruments & tickers", icon: "◎" },
            { href: "/transactions", title: "Transactions", desc: "History & reference lookup", icon: "≡" },
            { href: "/statement", title: "Tax Statement", desc: "Download & generate reports", icon: "▤" },
            { href: "/bulk", title: "Bulk Transfer", desc: "Batch portfolio operations", icon: "⇄" },
          ].map((card) => (
            <Link key={card.href} href={card.href}>
              <GlassCard cyan className="group hover:border-[rgba(34,211,238,0.35)] transition-all cursor-pointer h-full">
                <div className="text-2xl mb-2 cyan-text">{card.icon}</div>
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{card.title}</p>
                <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
