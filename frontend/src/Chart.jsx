// SmartTick/frontend/src/Chart.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer, // To make the chart responsive
} from 'recharts';

// Helper function to format large numbers (optional but nice)
const formatYAxisTick = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`; // Format as Millions
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`; // Format as Thousands
  }
  return value;
};

// Custom Tooltip formatter
const formatTooltipValue = (value) => {
    return `$${value.toLocaleString()}`; // Add $ sign and commas
}

function TradeChart({ data }) {
  if (!data || data.length === 0) {
    // Don't render the chart container if there's no data
    // App.jsx handles the "no data" message
    return null;
  }

  return (
    // Use ResponsiveContainer to make the chart adapt to its parent size
    <div style={{ width: '100%', height: 400 }}> {/* Set a height */}
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 30, // Increased left margin for Y-axis labels
            bottom: 5,
          }}
        >
          {/* Grid lines */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          {/* X-axis displaying the month label (e.g., '2024-03') */}
          <XAxis
             dataKey="month_label"
             tick={{ fontSize: 12 }} // Smaller font size for ticks
             angle={-30} // Angle ticks slightly if they overlap
             textAnchor="end" // Anchor angled text at the end
             height={50} // Increase height to accommodate angled labels
             interval={0} // Show all labels (can adjust if too crowded)
          />

          {/* Y-axis displaying the aggregated dollar amount */}
          <YAxis
            tickFormatter={formatYAxisTick} // Use the helper to format ticks
            tick={{ fontSize: 12 }}
            width={80} // Ensure enough width for formatted labels like "1.5M"
          />

          {/* Tooltip shown on hover */}
          <Tooltip
            formatter={formatTooltipValue} // Format values in tooltip
            labelStyle={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}
            itemStyle={{ fontSize: 12 }}
            contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', padding: '8px 12px' }}
          />

          {/* Legend to identify bars */}
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          {/* Bar for total 'buy' amount per month */}
          <Bar dataKey="buy_total" name="Total Buys ($)" fill="#4ade80" radius={[4, 4, 0, 0]} />

          {/* Bar for total 'sell' amount per month */}
          {/* Use negative values for sells to show below axis, OR stack them */}
          {/* Let's show them side-by-side for clarity */}
          <Bar dataKey="sell_total" name="Total Sells ($)" fill="#f87171" radius={[4, 4, 0, 0]} />

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TradeChart;
