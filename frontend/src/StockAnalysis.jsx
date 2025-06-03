// Stock analysis using Tiingo and politician trading data

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StockAnalysis({ symbol, historicalPriceData, trades }) {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    // Require both data sources to proceed
    if (!historicalPriceData || historicalPriceData.length < 10 || !trades || trades.length === 0) {
      setMetrics(null);
      if (historicalPriceData && historicalPriceData.length < 10) {
        setError("There is not enough historical price data. Need at least 10 days of data.");
      } else if (!trades || trades.length === 0) {
        setError("There is no congressional trade data available for sentiment analysis.");
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
            sma200: calcSMA(closePrices, 200),
          },
          volatility: calcVolatility(closePrices, highs, lows),
          rsi: calcRSI(closePrices),
          
          // Additional indicators using Tiingo volume data
          // From Investopedia: The volume-weighted average price (VWAP) is a technical indicator that 
	  // calculates a security's average price for the day, weighted by trading volume, to analyze 
	  // price trends and liquidity.
          
	  // On-balance volume (OBV), a momentum indicator that measures positive and negative volume flow
          volumeIndicators: {
            obv: calcOBV(closePrices, volumes),
            vwap: calcVWAP(closePrices, highs, lows, volumes, 14)
          },
          
          // Congressional sentiment
          congressionalSentiment: calcCongressSentiment(sortedTrades),
          
          // Performance stats
          performance: {
            overallReturn: calcPercentChange(closePrices[0], closePrices[closePrices.length - 1]),
            annualizedReturn: calcAnnualizedReturn(sortedPriceData),
          },
          
          // Volume statistics enhanced with Tiingo data
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

    // Calculations
    calcAllMetrics();
  }, [historicalPriceData, trades, symbol]);

  // Technical Analysis Calculations
  // Simple Moving Average
  const calcSMA = (prices, period) => {
    if (prices.length < period) return null;
    
    const lastNPrices = prices.slice(-period);
    const sum = lastNPrices.reduce((a, b) => a + b, 0);
    return parseFloat((sum / period).toFixed(2));
  };

  // Volatility calculation using high/low values
  const calcVolatility = (closes, highs, lows) => {
    if (closes.length < 10) return null; // Need reasonable amount of data
    
    const trueRanges = [];
    for (let i = 1; i < closes.length; i++) {
      const previousClose = closes[i-1];
      const high = highs[i];
      const low = lows[i];
    
      const tr = Math.max(
        high - low,
        Math.abs(high - previousClose),
        Math.abs(low - previousClose)
      );
      
      trueRanges.push(tr / previousClose * 100);
    }
    
    const avgTR = trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
    
    return parseFloat((avgTR * Math.sqrt(252)).toFixed(2));
  };

  // RSI - Relative Strength Index
  const calcRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return null;
    
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i-1]);
    }
    
    // Split into gains/losses
    const gains = [];
    const losses = [];
    for (const change of changes) {
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }
    
    // Initial averages
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;
    
    // Apply Wilder's smoothing for remaining data
    for (let i = period; i < changes.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  };

  // On Balance Volume calculations
  const calcOBV = (prices, volumes) => {
    if (prices.length < 2 || volumes.length < 2) return null;
    
    // Return a standardized OBV trend indicator (-100 to 100)
    const obvValues = [];
    let runningOBV = 0;
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i-1]) {
        runningOBV += volumes[i];
      } else if (prices[i] < prices[i-1]) {
        runningOBV -= volumes[i];
      }
      obvValues.push(runningOBV);
    }
    
    // Get trend over last 14 days
    if (obvValues.length < 14) return 0;
    
    const recentOBV = obvValues.slice(-14);
    const firstOBV = recentOBV[0];
    const lastOBV = recentOBV[recentOBV.length - 1];
    
    // Normalize to -100 to 100 scale
    const maxPossibleChange = recentOBV.reduce((sum, _, i) => {
      if (i === 0) return sum;
      return sum + Math.abs(volumes[prices.length - 14 + i]);
    }, 0);
    
    if (maxPossibleChange === 0) return 0;
    
    return parseFloat((((lastOBV - firstOBV) / maxPossibleChange) * 100).toFixed(2));
  };

  // Volume Weighted Average Price (VWAP)
  const calcVWAP = (closes, highs, lows, volumes, period = 14) => {
    if (closes.length < period || volumes.length < period) return null;
    
    // Typical price = (high + low + close) / 3, as defined in investopedia
    const typicalPrices = [];
    for (let i = 0; i < closes.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    // Calculate for the specified period
    const recentPrices = typicalPrices.slice(-period);
    const recentVolumes = volumes.slice(-period);
    
    let sumPriceVolume = 0;
    let sumVolume = 0;
    
    for (let i = 0; i < period; i++) {
      sumPriceVolume += recentPrices[i] * recentVolumes[i];
      sumVolume += recentVolumes[i];
    }
    
    if (sumVolume === 0) return null;
    
    return parseFloat((sumPriceVolume / sumVolume).toFixed(2));
  };

  // Simple percent change calculator
  const calcPercentChange = (startPrice, endPrice) => {
    if (!startPrice || startPrice === 0) return 0;
    return parseFloat(((endPrice - startPrice) / startPrice * 100).toFixed(2));
  };

  // Calculate annualized return using CAGR formula
  const calcAnnualizedReturn = (priceData) => {
    if (priceData.length < 2) return null;
    
    const startPrice = priceData[0].close;
    const endPrice = priceData[priceData.length - 1].close;
    
    // Calculate time difference
    const startDate = new Date(priceData[0].date);
    const endDate = new Date(priceData[priceData.length - 1].date);
    const yearDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
    
    // Need enough time to calculate meaningful annualized return
    if (yearDiff < 0.08) return null; // About a month
    
    // CAGR formula
    const totalReturn = (endPrice / startPrice) - 1;
    return parseFloat(((Math.pow(1 + totalReturn, 1 / yearDiff) - 1) * 100).toFixed(2));
  };

  // Congressional sentiment calculation (our unique metric)
  const calcCongressSentiment = (trades) => {
    // Look at the most recent trades
    const recentTrades = trades.slice(-20);
    
    // Count buys vs sells
    let buyCount = 0;
    let sellCount = 0;
    
    for (const trade of recentTrades) {
      const type = trade.type ? trade.type.toLowerCase() : '';
      if (type === 'buy') buyCount++;
      else if (type === 'sell') sellCount++;
    }
    
    // No trades of either type
    if (buyCount + sellCount === 0) return 0;
    
    // Scale from -100 (all sells) to +100 (all buys)
    return parseFloat(((buyCount - sellCount) / (buyCount + sellCount) * 100).toFixed(2));
  };
  
  // Calculate average volume over a period
  const calcAverageVolume = (volumes, period = 30) => {
    if (volumes.length < period) return null;
    
    const recentVolumes = volumes.slice(-period);
    const sum = recentVolumes.reduce((a, b) => a + b, 0);
    return Math.round(sum / period);
  };
  
  // Calculate volume trend (percent change)
  const calcVolumeTrend = (volumes) => {
    if (volumes.length < 10) return 0;
    
    // Compare average of first half vs second half
    const half = Math.floor(volumes.length / 2);
    const firstHalf = volumes.slice(0, half);
    const secondHalf = volumes.slice(half);
    
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (firstHalfAvg === 0) return 0;
    return parseFloat(((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100).toFixed(2));
  };
  
  // Volume metrics from politician trades
  const calcPoliticianVolumeMetrics = (trades) => {
    // Count buys and sells
    let buyCount = 0;
    let sellCount = 0;
    
    for (const trade of trades) {
      const type = trade.type ? trade.type.toLowerCase() : '';
      if (type === 'buy') buyCount++;
      else if (type === 'sell') sellCount++;
    }
    
    // Calculate metrics
    return {
      totalTrades: trades.length,
      buyTrades: buyCount,
      sellTrades: sellCount,
      buyRatio: buyCount + sellCount > 0 ? ((buyCount / (buyCount + sellCount)) * 100) : 0,
    };
  };

  // Generate buy/sell signals
  const generateSignals = (metrics) => {
    if (!metrics) return [];
    
    const signals = [];
    
    // RSI signals
    if (metrics.rsi) {
      if (metrics.rsi < 30) {
        signals.push({
          type: 'buy',
          strength: 'strong',
          indicator: 'RSI',
          message: 'RSI below 30 indicates oversold conditions'
        });
      } else if (metrics.rsi > 70) {
        signals.push({
          type: 'sell',
          strength: 'strong',
          indicator: 'RSI',
          message: 'RSI above 70 indicates overbought conditions'
        });
      }
    }
    
    // Moving average signals (golden cross / death cross)
    if (metrics.movingAverages.sma20 && metrics.movingAverages.sma50) {
      if (metrics.movingAverages.sma20 > metrics.movingAverages.sma50) {
        signals.push({
          type: 'buy',
          strength: 'moderate',
          indicator: 'SMA',
          message: '20-day SMA above 50-day SMA (golden cross)'
        });
      } else if (metrics.movingAverages.sma20 < metrics.movingAverages.sma50) {
        signals.push({
          type: 'sell',
          strength: 'moderate',
          indicator: 'SMA',
          message: '20-day SMA below 50-day SMA (death cross)'
        });
      }
    }
    
    // Congressional sentiment signals
    if (metrics.congressionalSentiment) {
      if (metrics.congressionalSentiment > 30) {
        signals.push({
          type: 'buy',
          strength: 'moderate',
          indicator: 'Congress',
          message: 'Strong buying activity among politicians'
        });
      } else if (metrics.congressionalSentiment < -30) {
        signals.push({
          type: 'sell',
          strength: 'moderate',
          indicator: 'Congress',
          message: 'Strong selling activity among politicians'
        });
      }
    }
    
    // OBV signals
    if (metrics.volumeIndicators.obv) {
      if (metrics.volumeIndicators.obv > 30) {
        signals.push({
          type: 'buy',
          strength: 'moderate',
          indicator: 'OBV',
          message: 'Strong positive volume trend supporting price'
        });
      } else if (metrics.volumeIndicators.obv < -30) {
        signals.push({
          type: 'sell',
          strength: 'moderate',
          indicator: 'OBV',
          message: 'Strong negative volume trend pressuring price'
        });
      }
    }
    
    return signals;
  };

  // Get overall stock rating 
  const getOverallRating = () => {
    if (!metrics) return "NEUTRAL";
    
    // Count buy vs sell signals
    const buySignals = signals.filter(s => s.type === 'buy').length;
    const sellSignals = signals.filter(s => s.type === 'sell').length;
    
    // Add additional signal points from metrics
    const rsiSignal = metrics.rsi > 70 ? -1 : metrics.rsi < 30 ? 1 : 0;
    const maSignal = !metrics.movingAverages.sma20 || !metrics.movingAverages.sma50 ? 0 : 
                    (metrics.movingAverages.sma20 > metrics.movingAverages.sma50 ? 1 : -1);
    const congressSignal = metrics.congressionalSentiment > 20 ? 1 : 
                          metrics.congressionalSentiment < -20 ? -1 : 0;
    const obvSignal = !metrics.volumeIndicators.obv ? 0 :
                      metrics.volumeIndicators.obv > 20 ? 1 :
                      metrics.volumeIndicators.obv < -20 ? -1 : 0;
    
    // Score system, positive = buy, negative = sell
    const score = (buySignals - sellSignals) + rsiSignal + maSignal + congressSignal + obvSignal;
    
    // Convert to rating string
    if (score >= 3) return "STRONG BUY";
    if (score > 0) return "BUY";
    if (score === 0) return "NEUTRAL";
    if (score > -3) return "SELL";
    return "STRONG SELL";
  };

  // Get color for the rating 
  const getRatingColor = () => {
    const rating = getOverallRating();
    
    switch(rating) {
      case "STRONG BUY": return theme.palette.success.dark;
      case "BUY": return theme.palette.success.main;
      case "NEUTRAL": return theme.palette.info.main;
      case "SELL": return theme.palette.error.main;
      case "STRONG SELL": return theme.palette.error.dark;
      default: return theme.palette.info.main;
    }
  };

  // Get rating description
  const getRatingDescription = () => {
    const rating = getOverallRating();
    
    const descriptions = {
      "STRONG BUY": `Multiple technical indicators for ${symbol.toUpperCase()} are showing strong positive signals, with favorable congressional trading activity.`,
      "BUY": `${symbol.toUpperCase()} is showing more positive signals than negative, suggesting potential upside in the near term.`,
      "NEUTRAL": `Technical indicators for ${symbol.toUpperCase()} are mixed, with no clear directional bias. Consider waiting for clearer signals.`,
      "SELL": `${symbol.toUpperCase()} is showing more negative signals than positive, suggesting potential downside risk.`,
      "STRONG SELL": `Multiple technical indicators for ${symbol.toUpperCase()} are showing strong negative signals, with concerning congressional trading patterns.`
    };
    
    return descriptions[rating];
  };

  // Helper to get color for a metric value
  const getMetricColor = (value, reverse = false) => {
    if (value === null || isNaN(value)) return theme.palette.text.secondary;
    
    if (!reverse) {
      // Normal scale - higher is better
      if (value > 0) return theme.palette.success.main;
      if (value < 0) return theme.palette.error.main;
      return theme.palette.text.secondary;
    } else {
      // Reverse scale - lower is better
      if (value > 50) return theme.palette.error.main;
      if (value < 30) return theme.palette.success.main;
      return theme.palette.warning.main;
    }
  };

  // RSI color
  const getRsiColor = (rsi) => {
    if (rsi === null || isNaN(rsi)) return theme.palette.text.secondary;
    if (rsi > 70) return theme.palette.error.main; // Overbought = bad
    if (rsi < 30) return theme.palette.success.main; // Oversold = good
    return theme.palette.info.main; // Normal
  };

  // Loading state
  if (isCalculating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error if calculation failed
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Show message if no metrics available
  if (!metrics) {
    return (
      <Alert severity="info">
        Insufficient data to calculate technical metrics for {symbol.toUpperCase()}.
      </Alert>
    );
  }

  // Main component render
  return (
    <Card sx={{ 
      borderRadius: 0, 
      boxShadow: 2, 
      bgcolor: theme.palette.background.paper,
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 0 }}>
        {/* Overall Rating Card */}
        <Paper sx={{ 
          mx: 2, 
          my: 2, 
          p: 0, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            bgcolor: getRatingColor(),
            color: '#fff',
            p: 1.5
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>Overall Analysis</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{getOverallRating()}</Typography>
          </Box>
          <Typography sx={{ p: 2 }}>{getRatingDescription()}</Typography>
        </Paper>
        
        {/* Main Content Grid */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid
              sx={{ flexBasis: { md: '48%' } }}
            >

              {/* Technical Indicators */}
              <Paper sx={{ borderRadius: 0 }}>
                <Typography sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>
                  Technical Indicators
                </Typography>
                
                {/* Moving Averages */}
                <Box sx={{ p: 2, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    Moving Averages
                    <Tooltip title="Simple Moving Averages show average price over time periods">
                      <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                    </Tooltip>
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">SMA (20-day)</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${metrics.movingAverages.sma20 || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">SMA (50-day)</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${metrics.movingAverages.sma50 || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">SMA (200-day)</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${metrics.movingAverages.sma200 || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* RSI and Volatility */}
                <Box sx={{ 
                  p: 2, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                  {/* RSI */}
                  <Box sx={{ textAlign: 'center', width: '48%' }}>
                    <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      RSI (14-day)
                      <Tooltip title="Relative Strength Index - above 70 is overbought, below 30 is oversold">
                        <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                      </Tooltip>
                    </Typography>
                    <Typography variant="h4" sx={{ color: getRsiColor(metrics.rsi), fontWeight: 'bold' }}>
                      {metrics.rsi || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: getRsiColor(metrics.rsi) }}>
                      {metrics.rsi > 70 ? 'Overbought' : metrics.rsi < 30 ? 'Oversold' : 'Neutral'}
                    </Typography>
                  </Box>
                  
                  {/* Divider between RSI and Volatility */}
                  <Divider orientation="vertical" flexItem />
                  
                  {/* Volatility */}
                  <Box sx={{ textAlign: 'center', width: '48%' }}>
                    <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      Volatility
                      <Tooltip title="How much price varies - higher means more risk and potential for big swings">
                        <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                      </Tooltip>
                    </Typography>
                    <Typography variant="h4" sx={{ color: getMetricColor(metrics.volatility, true), fontWeight: 'bold' }}>
                      {metrics.volatility || 'N/A'}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: getMetricColor(metrics.volatility, true) }}>
                      {metrics.volatility > 50 ? 'High' : metrics.volatility < 20 ? 'Low' : 'Moderate'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* OBV Indicator */}
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    On-Balance Volume Trend
                    <Tooltip title="On-Balance Volume trend indicator showing volume pressure">
                      <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                    </Tooltip>
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      color: getMetricColor(metrics.volumeIndicators.obv),
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 'bold'
                    }}>
                      {metrics.volumeIndicators.obv}
                      {metrics.volumeIndicators.obv > 0 ? (
                        <ArrowUpwardIcon sx={{ ml: 0.5 }} />
                      ) : metrics.volumeIndicators.obv < 0 ? (
                        <ArrowDownwardIcon sx={{ ml: 0.5 }} />
                      ) : null}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    textAlign: 'center',
                    color: getMetricColor(metrics.volumeIndicators.obv)
                  }}>
                    {metrics.volumeIndicators.obv > 30 ? 'Strong buying volume' : 
                    metrics.volumeIndicators.obv < -30 ? 'Strong selling volume' : 'Neutral volume flow'}
                  </Typography>
                </Box>
                
                {/* Congressional Sentiment */}
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    Congressional Sentiment
                    <Tooltip title="Whether politicians are buying or selling this stock">
                      <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                    </Tooltip>
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      color: getMetricColor(metrics.congressionalSentiment),
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 'bold'
                    }}>
                      {metrics.congressionalSentiment}
                      {metrics.congressionalSentiment > 0 ? (
                        <ArrowUpwardIcon sx={{ ml: 0.5 }} />
                      ) : metrics.congressionalSentiment < 0 ? (
                        <ArrowDownwardIcon sx={{ ml: 0.5 }} />
                      ) : null}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    textAlign: 'center',
                    color: getMetricColor(metrics.congressionalSentiment)
                  }}>
                    {metrics.congressionalSentiment > 30 ? 'Bullish' : 
                    metrics.congressionalSentiment < -30 ? 'Bearish' : 'Neutral'} political trading activity
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {/* Right Column */}
            <Grid
              sx={{ flexBasis: { md: '48%' } }}
            >
              {/* VWAP and Price Data */}
              <Paper sx={{ mb: 2, borderRadius: 0 }}>
                <Typography sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>
                  Price Metrics
                </Typography>
                
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Latest Price</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${metrics.latestPrice?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Volume Weighted Average Price (14-day)</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${metrics.volumeIndicators.vwap || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    Price vs Volume Weighted Average Price
                    <Tooltip title="Current price compared to Volume Weighted Average Price">
                      <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                    </Tooltip>
                  </Typography>
                  
                  {metrics.volumeIndicators.vwap && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ 
                          color: metrics.latestPrice > metrics.volumeIndicators.vwap 
                            ? theme.palette.success.main 
                            : theme.palette.error.main,
                          fontWeight: 'medium'
                        }}>
                          {metrics.latestPrice > metrics.volumeIndicators.vwap ? 'Above' : 'Below'} VWAP
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ textAlign: 'center' }}>
                        {metrics.latestPrice > metrics.volumeIndicators.vwap
                          ? 'Price trading above average, potential bullish momentum'
                          : 'Price trading below average, potential bearish pressure'}
                      </Typography>
                    </>
                  )}
                </Box>
              </Paper>
            
              {/* Performance Section */}
              <Paper sx={{ mb: 2, borderRadius: 0 }}>
                <Typography sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>
                  Performance
                  <Tooltip title="How the stock has performed over the analyzed period">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                  </Tooltip>
                </Typography>
                
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Overall Return</Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 'medium',
                      color: getMetricColor(metrics.performance.overallReturn)
                    }}>
                      {metrics.performance.overallReturn > 0 ? '+' : ''}
                      {metrics.performance.overallReturn}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Annualized Return</Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 'medium',
                      color: getMetricColor(metrics.performance.annualizedReturn)
                    }}>
                      {metrics.performance.annualizedReturn !== null ? (
                        <>
                          {metrics.performance.annualizedReturn > 0 ? '+' : ''}
                          {metrics.performance.annualizedReturn}%
                        </>
                      ) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
              
              {/* Volume Metrics */}
              <Paper sx={{ mb: 2, borderRadius: 0 }}>
                <Typography sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>
                  Volume Metrics
                  <Tooltip title="Stats about trading volume and activity">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                  </Tooltip>
                </Typography>
                
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Average Volume (30-day)</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {metrics.volumeMetrics.avgVolume?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Volume Trend</Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 'medium',
                      color: getMetricColor(metrics.volumeMetrics.volumeTrend)
                    }}>
                      {metrics.volumeMetrics.volumeTrend > 0 ? '+' : ''}
                      {metrics.volumeMetrics.volumeTrend}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Political Buy/Sell Ratio</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {metrics.volumeMetrics.buyRatio?.toFixed(1) || 0}% Buy
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Congressional Trades</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {metrics.volumeMetrics.totalTrades || 0}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
              
              {/* Trading Signals */}
              <Paper sx={{ borderRadius: 0 }}>
                <Typography sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>
                  Trading Signals
                  <Tooltip title="Buy/sell signals based on technical analysis">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.7, fontSize: 16 }} />
                  </Tooltip>
                </Typography>
                
                {signals.length === 0 ? (
                  <Typography sx={{ p: 2, textAlign: 'center', color: theme.palette.text.secondary }}>
                    No strong signals at this time
                  </Typography>
                ) : (
                  <Box sx={{ p: 2 }}>
                    {signals.map((signal, index) => (
                      <Box key={index} sx={{ 
                        mb: index !== signals.length - 1 ? 2 : 0,
                        p: 1.5, 
                        borderLeft: `4px solid ${signal.type === 'buy' ? theme.palette.success.main : theme.palette.error.main}`,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ 
                            color: signal.type === 'buy' ? theme.palette.success.main : theme.palette.error.main 
                          }}>
                            {signal.type.toUpperCase()} ({signal.indicator})
                          </Typography>
                          <Chip 
                            label={signal.strength} 
                            size="small"
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {signal.message}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}

export default StockAnalysis;
