// Implementing stock analysis based on various factors
// Investopedia was used as a key resource to understand different metrics/formulas/thresholds etc. 

import React, { useState, useEffect } from 'react';
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
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Label
} from 'recharts';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StockAnalysis({ symbol, trades }) {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    if (!trades || trades.length === 0) {
      setMetrics(null);
      return;
    }

    const calcAllMetrics = async () => {
      setIsCalculating(true);
      
      try {
        // Sort trades oldest->newest so chart makes sense
        // Some trades use 'traded' and others use 'trade_date' field
        const sortedTrades = [...trades].sort((a, b) => 
          new Date(a.traded || a.trade_date) - new Date(b.traded || b.trade_date)
        );

        // Get price data from trades transactions
        const tradePrices = sortedTrades.map(trade => {
          if (!trade.price) return 0;
          return typeof trade.price === 'string' 
            ? parseFloat(trade.price.replace(/[$,]/g, ''))
            : parseFloat(trade.price);
        }).filter(price => !isNaN(price) && price > 0);
        
        // Not enough data to do anything useful - if not much data available
        // Normally threshold should be even higher to really get something meaningful
        if (tradePrices.length < 3) {
          setError("Not enough trade data to analyze. Need at least 3 trades.");
          setIsCalculating(false);
          return;
        }

        // Create price history points from the trades data
        const historyPoints = [];
        for (let i = 0; i < sortedTrades.length; i++) {
          const trade = sortedTrades[i];
          
          // Skip trades without dates or prices
          if ((!trade.traded && !trade.trade_date) || !tradePrices[i]) continue;
          
          const dateStr = new Date(trade.traded || trade.trade_date)
            .toISOString().split('T')[0];
          
          historyPoints.push({
            date: dateStr,
            price: tradePrices[i]
          });
        }
        
        // If there are no valid points, just exit. Hopefully we should have as we are building from trades data
        if (historyPoints.length === 0) {
          setError("Couldn't extract valid price history from trades");
          setIsCalculating(false);
          return;
        }
        
        // Update price history for the chart
        setPriceHistory(historyPoints);

        // Calculate all metrics
        const calculatedMetrics = {
          latestPrice: tradePrices[tradePrices.length - 1],
          
          // Technical indicators
          movingAverages: {
            sma20: calcSMA(tradePrices, 20),
            sma50: calcSMA(tradePrices, 50),
            sma200: calcSMA(tradePrices, 200),
          },
          volatility: calcVolatility(tradePrices),
          rsi: calcRSI(tradePrices),
          
          congressionalSentiment: calcCongressSentiment(sortedTrades),
          
          // Performance stats
          performance: {
            overallReturn: calcPercentChange(tradePrices[0], tradePrices[tradePrices.length - 1]),
            annualizedReturn: calcAnnualReturn(tradePrices[0], tradePrices[tradePrices.length - 1], sortedTrades),
          },
          
          // Volume stats
          volumeMetrics: calcVolumeMetrics(sortedTrades),
        };
        
        // Save the metrics and generate signals
        setMetrics(calculatedMetrics);
        setSignals(generateSignals(calculatedMetrics));
        
      } catch (err) {
        console.error("Something did not work:", err);
        setError(`Error analyzing data: ${err.message}. Try a different stock.`);
      } finally {
        setIsCalculating(false);
      }
    };

    // Start the calculations
    calcAllMetrics();
  }, [trades, symbol]);

  // Technical Analysis Calculations
  // Simple Moving Average - just average of last N prices
  const calcSMA = (prices, period) => {
    // Not enough data for this SMA
    if (prices.length < period) return null;
    
    const lastNPrices = prices.slice(-period);
    const sum = lastNPrices.reduce((a, b) => a + b, 0);
    return parseFloat((sum / period).toFixed(2));
  };

  // Volatility - how wild the price swings are
  const calcVolatility = (prices) => {
    if (prices.length < 5) return null; // Need 5+ data points
    
    // Calculate daily % returns
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i-1] > 0) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
    }
    
    // Calculate variance - average squared difference from mean
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    let sumSquaredDiff = 0;
    for (let i = 0; i < returns.length; i++) {
      sumSquaredDiff += (returns[i] - avgReturn) ** 2;
    }
    const variance = sumSquaredDiff / returns.length;
    
    // Annualize, standard in finance = daily stddev * sqrt(252 trading days))
    return parseFloat((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2));
  };

  // RSI - Relative Strength Index - shows if stock is overbought/oversold
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
    
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;
    
    // Apply Wilder's smoothing
    for (let i = period; i < changes.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  };

  // Simple percent change calculator
  const calcPercentChange = (startPrice, endPrice) => {
    if (!startPrice || startPrice === 0) return 0;
    return parseFloat(((endPrice - startPrice) / startPrice * 100).toFixed(2));
  };

  // Annual return using CAGR (Compound Annual Growth Rate) formula (reference: Investopedia)
  const calcAnnualReturn = (startPrice, endPrice, trades) => {
    if (trades.length < 2) return null;
    
    // Time between first and last trade
    const startDate = new Date(trades[0].traded || trades[0].trade_date);
    const endDate = new Date(trades[trades.length - 1].traded || trades[trades.length - 1].trade_date);
    const yearDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
    
    // Need decent amount of time to calc this (approx a month)
    if (yearDiff < 0.08) return null;
    
    // CAGR formula: (endValue / beginValue)^(1/years) - 1
    const totalReturn = (endPrice / startPrice) - 1;
    return parseFloat(((Math.pow(1 + totalReturn, 1 / yearDiff) - 1) * 100).toFixed(2));
  };

  // This is my own made-up metric that measures if politicians are buying/selling
  // Not sure how good or accurate this is but was interesting to implement something like "buy-sell ratio"
  const calcCongressSentiment = (trades) => {
    // Just look at recent trades, like 20
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

  // Volume stats
  const calcVolumeMetrics = (trades) => {
    // Count buys and sells
    let buyCount = 0;
    let sellCount = 0;
    
    for (const trade of trades) {
      const type = trade.type ? trade.type.toLowerCase() : '';
      if (type === 'buy') buyCount++;
      else if (type === 'sell') sellCount++;
    }
    
    // Split into first and second half to see trend
    const midpoint = Math.floor(trades.length / 2);
    const firstHalf = trades.slice(0, midpoint);
    const secondHalf = trades.slice(midpoint);
    
    // Convert ranges to numbers
    const getSizeValue = (size) => {
      if (!size) return 0;
      if (typeof size === 'number') return size;
      
      // Parse strings with $ and commas
      if (typeof size === 'string') {
        // Find dollar amounts in the string
        const moneyMatches = size.match(/[$]?[\d,]+/g);
        if (moneyMatches && moneyMatches.length > 0) {
          // If range like "$1,000-$15,000", use average
          if (moneyMatches.length >= 2) {
            const lower = parseInt(moneyMatches[0].replace(/[$,]/g, ''));
            const upper = parseInt(moneyMatches[1].replace(/[$,]/g, ''));
            return (lower + upper) / 2;
          } else {
            return parseInt(moneyMatches[0].replace(/[$,]/g, ''));
          }
        }
      }
      
      return 0;
    };
    
    // Sum up trade volumes
    let firstHalfVolume = 0;
    for (const trade of firstHalf) {
      firstHalfVolume += getSizeValue(trade.size);
    }
    
    let secondHalfVolume = 0;
    for (const trade of secondHalf) {
      secondHalfVolume += getSizeValue(trade.size);
    }
    
    // Get trend as % change
    let volumeTrend = 0;
    if (firstHalfVolume > 0) {
      volumeTrend = ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100;
    }
    
    return {
      totalTrades: trades.length,
      buyTrades: buyCount,
      sellTrades: sellCount,
      buyRatio: buyCount + sellCount > 0 ? ((buyCount / (buyCount + sellCount)) * 100) : 0,
      volumeTrend: parseFloat(volumeTrend.toFixed(2))
    };
  };

  // Generate buy/sell signals from our metrics
  // These thresholds are from Investopedia
  const generateSignals = (metrics) => {
    if (!metrics) return [];
    
    const signals = [];
    
    // RSI oversold/overbought signals
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
    
    // Moving average golden cross / death cross
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
    
    // Congressional sentiment calculated earlier in the code
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
    
    // Score system, positive = buy, negative = sell
    const score = (buySignals - sellSignals) + rsiSignal + maSignal + congressSignal;
    
    // Convert to rating string
    if (score >= 3) return "STRONG BUY";
    if (score > 0) return "BUY";
    if (score === 0) return "NEUTRAL";
    if (score > -3) return "SELL";
    return "STRONG SELL";
  };

  // Get color for the rating as appropriate
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

  // Get description for the rating
  const getRatingDescription = () => {
    const rating = getOverallRating();
    
    // Use object for cleaner lookup
    const descriptions = {
      "STRONG BUY": `Multiple technical indicators for ${symbol} are showing strong positive signals, with favorable congressional trading activity.`,
      "BUY": `${symbol} is showing more positive signals than negative, suggesting potential upside in the near term.`,
      "NEUTRAL": `Technical indicators for ${symbol} are mixed, with no clear directional bias. Consider waiting for clearer signals.`,
      "SELL": `${symbol} is showing more negative signals than positive, suggesting potential downside risk.`,
      "STRONG SELL": `Multiple technical indicators for ${symbol} are showing strong negative signals, with concerning congressional trading patterns.`
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
        Insufficient data to calculate technical metrics for {symbol}.
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
        {/* Title Bar */}
        <Typography variant="h6" sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          Technical Analysis for {symbol}
        </Typography>
        
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
        <Box sx={{ px: 2, pb: 2 }}>
          <Grid container spacing={2}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              {/* Price Chart */}
              <Paper sx={{ mb: 2, borderRadius: 0, overflow: 'hidden' }}>
                <Typography sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>
                  Price History
                  {priceHistory.length < 2 && " (Not enough data)"}
                </Typography>
                
                <Box sx={{ height: 250, p: 1 }}>
                  {priceHistory.length < 2 ? (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Typography color="text.secondary">
                        Not enough price points to draw chart
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          // Format dates to MM/DD
                          tickFormatter={(value) => {
                            try {
                              const date = new Date(value);
                              return `${date.getMonth()+1}/${date.getDate()}`;
                            } catch (e) {
                              return value;
                            }
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tickFormatter={(value) => `$${value}`}
                        />
                        <RechartsTooltip 
                          formatter={(value) => [`$${value}`, 'Price']} 
                          labelFormatter={(label) => {
                            try {
                              return new Date(label).toLocaleDateString();
                            } catch (e) {
                              return label;
                            }
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={true} 
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
              
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
            <Grid item xs={12} md={6}>
              {/* Performance Section */}
             <Paper sx={{ mb: 2, borderRadius: 0 }}>
               <Typography sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>
                 Performance
                 <Tooltip title="How the stock has performed based on trade data">
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
               
               <Box sx={{ p: 2 }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                   <Typography variant="body2">Buy/Sell Ratio</Typography>
                   <Typography variant="body1" fontWeight="medium">
                     {metrics.volumeMetrics.buyRatio.toFixed(1)}% Buy
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