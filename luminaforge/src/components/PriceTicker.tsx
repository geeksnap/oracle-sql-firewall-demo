"use client";

import { useEffect, useRef } from "react";

const TICKERS = [
  { symbol: "AAPL",        price: "187.23",     change: "+1.2%",  up: true  },
  { symbol: "NVDA",        price: "924.60",     change: "+3.1%",  up: true  },
  { symbol: "ORCL",        price: "141.50",     change: "+2.3%",  up: true  },
  { symbol: "MSFT",        price: "415.20",     change: "+0.5%",  up: true  },
  { symbol: "TSLA",        price: "172.40",     change: "-0.8%",  up: false },
  { symbol: "AMZN",        price: "189.75",     change: "-0.4%",  up: false },
  { symbol: "GS",          price: "478.30",     change: "+1.8%",  up: true  },
  { symbol: "JPM",         price: "201.40",     change: "+0.9%",  up: true  },
  { symbol: "GOLD",        price: "2,342.10",   change: "+0.9%",  up: true  },
  { symbol: "BTC",         price: "68,450",     change: "+2.7%",  up: true  },
  { symbol: "ETH",         price: "3,620",      change: "+1.8%",  up: true  },
  { symbol: "ROLEX-SUB",   price: "12,500",     change: "0.0%",   up: true  },
  { symbol: "PATEK-5711",  price: "185,000",    change: "+2.1%",  up: true  },
  { symbol: "RM-055",      price: "290,000",    change: "+1.4%",  up: true  },
  { symbol: "BASQUIAT",    price: "8,700,000",  change: "+5.2%",  up: true  },
];

export function PriceTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let pos = 0;
    const speed = 0.6;
    let raf: number;

    const animate = () => {
      pos -= speed;
      const halfWidth = track.scrollWidth / 2;
      if (Math.abs(pos) >= halfWidth) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = [...TICKERS, ...TICKERS];

  return (
    <div
      className="overflow-hidden border-y"
      style={{
        borderColor: "rgba(244,201,93,0.14)",
        background: "rgba(15,23,42,0.9)",
        height: 36,
      }}
    >
      <div className="flex h-full items-center">
        <div ref={trackRef} className="flex shrink-0 items-center gap-8 px-4 whitespace-nowrap">
          {items.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-300">{t.symbol}</span>
              <span className="font-mono text-slate-400">${t.price}</span>
              <span
                className="font-semibold"
                style={{ color: t.up ? "#4ade80" : "#f43f5e" }}
              >
                {t.up ? "▲" : "▼"} {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
