import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Text,
} from 'recharts';

// Helper function to format large numbers for the Y-axis
const formatYAxisTick = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`; // Format as Millions
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`; // Format as Thousands
  return value;
};

// Helper function to format tooltip values
const formatTooltipValue = (value) => `$${value.toLocaleString()}`; // Add $ sign and commas

// TradeChart Component
function TradeChart({ data }) {
  if (!data || data.length === 0) {
    // Don't render the chart if there's no data
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
        No data available to display.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 450 }}> {/* Responsive container with fixed height */}
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 40, right: 30, left: 30, bottom: 20 }} // Adjust margins for better spacing
        >
          {/* Title for the bar chart */}
          <text
            x="50%"
            y="20"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              fontFamily: 'Roboto, sans-serif',
              fill: '#333',
            }}
          >
            Monthly Trade Summary
          </text>

          {/* Grid lines */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          {/* X-axis for month labels */}
          <XAxis
            dataKey="month_label"
            tick={{ fontSize: 12, fontFamily: 'Roboto, sans-serif' }}
            angle={-30} // Rotate labels for better readability
            textAnchor="end"
            height={50} // Increase height for angled labels
            interval={0} // Show all labels
          />

          {/* Y-axis for dollar amounts */}
          <YAxis
            tickFormatter={formatYAxisTick} // Format Y-axis ticks
            tick={{ fontSize: 12, fontFamily: 'Roboto, sans-serif' }}
            width={80} // Adjust width for formatted labels
          />

          {/* Tooltip for hover details */}
          <Tooltip
            formatter={formatTooltipValue}
            labelStyle={{ fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: 'Roboto, sans-serif' }}
            itemStyle={{ fontSize: 12, fontFamily: 'Roboto, sans-serif' }}
            contentStyle={{
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              padding: '8px 12px',
            }}
          />

          {/* Legend for bar identification */}
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px',
              fontFamily: 'Roboto, sans-serif',
            }}
          />

          {/* Bar for total 'buy' amounts */}
          <Bar
            dataKey="buy_total"
            name="Total Buys ($)"
            fill="#4ade80"
            radius={[4, 4, 0, 0]} // Rounded top corners
          />

          {/* Bar for total 'sell' amounts */}
          <Bar
            dataKey="sell_total"
            name="Total Sells ($)"
            fill="#f87171"
            radius={[4, 4, 0, 0]} // Rounded top corners
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TradeChart;
