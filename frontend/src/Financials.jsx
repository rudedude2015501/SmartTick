import { useState, useEffect } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Static definitions for each metric (label, description, mock value).
 * You can replace the `value` fields with real data when you wire this up.
 */
export const metricData = {
  marketPerformance: [
    {
      key: 'ten_day_avg_volume',
      label: '10-Day Avg. Volume',
      description: 'Average number of shares traded daily over the past 10 trading days.',
      value: '54.1 M',
    },
    {
      key: 'thirteen_week_return',
      label: '13-Week Return',
      description: 'Percentage change in stock price over the last 13 weeks.',
      value: '-12.5 %',
    },
    {
      key: 'fifty_two_wk_high',
      label: '52-Week High',
      description: 'Highest stock price in the past 52 weeks.',
      value: '$260.10',
    },
    {
      key: 'fifty_two_wk_low',
      label: '52-Week Low',
      description: 'Lowest stock price in the past 52 weeks.',
      value: '$169.21',
    },
    {
      key: 'beta',
      label: 'Beta',
      description: 'Volatility relative to the overall market (β > 1 is more volatile).',
      value: '1.22',
    },
  ],
  valuation: [
    {
      key: 'pe_ttm',
      label: 'P/E (TTM)',
      description: 'Price-to-Earnings ratio (trailing twelve months).',
      value: '32.05',
    },
    {
      key: 'pb',
      label: 'P/B',
      description: 'Price-to-Book ratio: market price / book value per share.',
      value: '46.68',
    },
    {
      key: 'ps_ttm',
      label: 'P/S (TTM)',
      description: 'Price-to-Sales ratio (trailing twelve months).',
      value: '7.79',
    },
    {
      key: 'dividend_yield_ttm',
      label: 'Div. Yield (TTM)',
      description: 'Annual dividends per share / current share price.',
      value: '0.49 %',
    },
  ],
  profitability: [
    {
      key: 'roe_ttm',
      label: 'ROE (TTM)',
      description: 'Return on Equity (trailing twelve months).',
      value: '151.3 %',
    },
    {
      key: 'roa_ttm',
      label: 'ROA (TTM)',
      description: 'Return on Assets (trailing twelve months).',
      value: '28.4 %',
    },
    {
      key: 'eps_ttm',
      label: 'EPS (TTM)',
      description: 'Earnings per Share (trailing twelve months).',
      value: '$6.41',
    },
  ],
  growth: [
    {
      key: 'rev_growth_ttm_yoy',
      label: 'Rev. Growth YoY',
      description: 'Year-over-year revenue growth (trailing twelve months).',
      value: '4.9 %',
    },
    {
      key: 'eps_growth_ttm_yoy',
      label: 'EPS Growth YoY',
      description: 'Year-over-year EPS growth (trailing twelve months).',
      value: '-0.4 %',
    },
  ],
  liquidity: [
    {
      key: 'current_ratio_quarterly',
      label: 'Current Ratio',
      description: 'Quarterly current assets / current liabilities.',
      value: '0.82',
    },
    {
      key: 'quick_ratio_quarterly',
      label: 'Quick Ratio',
      description: 'Quarterly (current assets − inventory) / current liabilities.',
      value: '0.78',
    },
  ],
};

/**
 * MetricsSection
 * Renders a titled box of metrics laid out horizontally with vertical separators.
 *
 * Props:
 * - title: string (category name)
 * - metrics: array of { key, label, description, value }
 */
export function MetricsSection({ title, metrics }) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      {/* Category title */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>

      {/* Box with top & bottom border */}
      <Box
        sx={{
          display: 'flex',
          borderTop: `1px solid ${theme.palette.divider}`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {metrics.map((m, idx) => (
          <Box
            key={m.key}
            sx={{
              flex: 1,
              textAlign: 'center',
              p: 2,
              borderRight:
                idx < metrics.length - 1
                  ? `1px solid ${theme.palette.divider}`
                  : 'none',
            }}
          >
            {/* Label with info tooltip */}
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              gutterBottom
            >
              {m.label}
              <Tooltip title={m.description} arrow>
                <InfoIcon fontSize="small" sx={{ ml: 0.5, opacity: 0.6 }} />
              </Tooltip>
            </Typography>

            {/* Value */}
            <Typography variant="h6">{m.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}