// CalculateScores.jsx
// Utility for computing a 0‑100 buy / sell score for a single stock
// All weights and normalization logic live in `metricConfig` so the formula
// is centralized and easy to tweak.

useEffect(() => {
  // Require both data sources to proceed
  if (!historicalPriceData || historicalPriceData.length < 10 || !trades || trades.length === 0) {
    setMetrics(null);
    if (historicalPriceData && historicalPriceData.length < 10) {
      setError("Not enough historical price data. Need at least 10 days of data.");
    } else if (!trades || trades.length === 0) {
      setError("No congressional trade data available for sentiment analysis.");
    }
    return;
  }

  const calcAllMetrics = async () => {
    setIsCalculating(true);
    
    try {
      // Get price data from Tiingo historical prices
      const sortedPriceData = [...historicalPriceData].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      const closePrices = sortedPriceData.map(day => day.close);
      const volumes = sortedPriceData.map(day => day.volume);
      const highs = sortedPriceData.map(day => day.high);
      const lows = sortedPriceData.map(day => day.low);
      
      // Sort trades for congressional sentiment
      const sortedTrades = [...trades].sort((a, b) => 
        new Date(a.traded || a.trade_date) - new Date(b.traded || b.trade_date)
      );
      
      // Calculate metrics
      const calculatedMetrics = {
        latestPrice: closePrices[closePrices.length - 1],
        
        // Technical indicators from Tiingo data
        movingAverages: {
          sma20: calcSMA(closePrices, 20),
          sma50: calcSMA(closePrices, 50),
        },

        volatility: calcVolatility(closePrices, highs, lows),
        rsi: calcRSI(closePrices),
        
        // Additional indicators using Tiingo volume data
        // From Investopedia: The volume-weighted average price (VWAP) is a technical indicator that calculates a security's average price for the day, weighted by trading volume, to analyze price trends and liquidity.
        // From Investopedia: On-balance volume (OBV), a momentum indicator that measures positive and negative volume flow
        volumeIndicators: {
          obv: calcOBV(closePrices, volumes),
          vwap: calcVWAP(closePrices, highs, lows, volumes, 14)
        },
        
        // Congressional sentiment
        congressionalSentiment: calcCongressSentiment(sortedTrades),
        
        // Volume stats enhanced with Tiingo data
        volumeMetrics: {
          avgVolume: calcAverageVolume(volumes, 30),
          volumeTrend: calcVolumeTrend(volumes),
          ...calcPoliticianVolumeMetrics(sortedTrades),
        },
      };
      
      setMetrics(calculatedMetrics);
      setSignals(generateSignals(calculatedMetrics));
      
    } catch (err) {
      console.error("Error in analysis calculations:", err);
      setError(`Error analyzing data: ${err.message}. Try a different stock.`);
    } finally {
      setIsCalculating(false);
    }
  };

  // Start the calculations
  calcAllMetrics();
}, [historicalPriceData, trades, symbol]);



/**
 * Normalise helpers ----------------------------------------------------------
 */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// RSI → U‑shaped score (oversold = high score; overbought = low)
const normRSI = (rsi) => {
  if (rsi == null) return 50;
  if (rsi < 30) return 60 + ((30 - rsi) / 30) * 40; // 30→100, 0→100-ish cap
  if (rsi > 70) return 40 - ((rsi - 70) / 30) * 40; // 70→40, 100→0
  // mid‑range 30‑70 maps linearly 60→40
  return 60 - ((rsi - 30) / 40) * 20;
};

// SMA signal: +1 bullish, 0 neutral, ‑1 bearish
const normSmaSignal = (signal) => ({ 1: 100, 0: 50, "-1": 0 }[signal] ?? 50);

// Volatility (daily %). Lower is better.
const normVol = (volPct) => 100 * (1 - clamp(volPct, 0, 5) / 5);

// OBV trend (%) between –10 and +10
const normObv = (trendPct) => clamp((trendPct + 10) / 20 * 100, 0, 100);

// Price vs VWAP as percent diff (e.g. +3 ⇒ 3% above)
const normVwap = (pctDiff) => clamp((pctDiff + 5) / 10 * 100, 0, 100);

// Avg volume (ten‑day). Higher up to 1M gets full score.
const normVolume = (vol) => 100 * Math.min(vol, 1_000_000) / 1_000_000;

// 13‑week return (%) between –20 and +20
const normReturn = (retPct) => clamp((retPct + 20) / 40 * 100, 0, 100);

// Congressional sentiment (–100 … 100) linear shift
const normSentiment = (sent) => (sent + 100) / 2;

// Buy/Sell ratio capped at 2
const normRatio = (ratio) => clamp(ratio, 0, 2) / 2 * 100;

/**
 * Metric configuration -------------------------------------------------------
 */
const metricConfig = [
  { key: "rsi14",              weight: 0.10, normalise: normRSI },
  { key: "smaSignal",          weight: 0.10, normalise: normSmaSignal },
  { key: "volatility",         weight: 0.05, normalise: normVol },
  { key: "obvTrend",           weight: 0.10, normalise: normObv },
  { key: "vwapDiffPct",        weight: 0.10, normalise: normVwap },
  { key: "avgVolume10d",       weight: 0.05, normalise: normVolume },
  { key: "return13w",          weight: 0.15, normalise: normReturn },
  { key: "congressSentiment",  weight: 0.20, normalise: normSentiment },
  { key: "congressBuySell",    weight: 0.15, normalise: normRatio },
];

/**
 * Main scoring function ------------------------------------------------------
 * @param {Object} metrics – flat object containing all keys above.
 * @returns {number} score 0‑100
 */
export function calculateStockScore(metrics) {
  let sum = 0;
  metricConfig.forEach(({ key, weight, normalise }) => {
    const raw = metrics[key];
    const norm = normalise(raw);
    sum += weight * norm;
  });
  return Number(sum.toFixed(1));
}

/**
 * Example: assembling the metrics for one symbol -----------------------------
 * (You would call this where you already have technical + sentiment + financial data.)
 */
export function buildMetricObject({ technical, sentiment, financial }) {
  return {
    // technical
    rsi14: technical.rsi14,
    smaSignal: technical.sma20Over50,          // +1 / 0 / ‑1
    volatility: technical.volPct,
    obvTrend: technical.obvTrendPct,
    vwapDiffPct: technical.priceVsVwapPct,
    avgVolume10d: financial.ten_day_avg_volume,
    return13w: financial.thirteen_week_return,
    // congressional sentiment
    congressSentiment: sentiment.score,        // –100 … 100
    congressBuySell:  sentiment.buySellRatio,  // numeric ratio
  };
}

// ---------------------------------------------------------------------------
// Usage example (pseudo‑code):
// const metrics = buildMetricObject({ technical, sentiment, financial });
// const score   = calculateStockScore(metrics);
// ---------------------------------------------------------------------------
