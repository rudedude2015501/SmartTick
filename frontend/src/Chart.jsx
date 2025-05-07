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
} from 'recharts';
import { useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Theme colors
  const colors = {
    buyBar: isDarkMode ? '#4ade80' : '#4ade80', // Keep green in both modes
    sellBar: isDarkMode ? '#f87171' : '#f87171', // Keep red in both modes
    grid: isDarkMode ? '#555555' : '#e0e0e0',
    text: isDarkMode ? '#ffffff' : '#333333',
    tooltipBg: isDarkMode ? '#333333' : '#ffffff',
    tooltipBorder: isDarkMode ? '#555555' : 'rgba(0,0,0,0.1)',
    tooltipText: isDarkMode ? '#ffffff' : '#333333',
  };

  if (!data || data.length === 0) {
    // Don't render the chart if there's no data
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: colors.text, 
        fontFamily: 'Roboto, sans-serif' 
      }}>
        No data available to display.
      </div>
    );
  }

  // Custom tooltip component that respects theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: colors.tooltipBg,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          padding: '8px 12px',
        }}>
          <p style={{ 
            fontSize: 14, 
            fontWeight: 'bold', 
            color: colors.tooltipText, 
            fontFamily: 'Roboto, sans-serif',
            margin: '0 0 5px 0',
          }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ 
              fontSize: 12, 
              color: entry.color,
              fontFamily: 'Roboto, sans-serif',
              margin: '3px 0',
            }}>
              {entry.name}: {formatTooltipValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
              fill: isDarkMode ? '#ffffff' : '#333333',
            }}
          >
            Monthly Trade Summary
          </text>
          
          {/* Grid lines with theme-aware color */}
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          
          {/* X-axis for month labels */}
          <XAxis
            dataKey="month_label"
            tick={{ 
              fontSize: 12, 
              fontFamily: 'Roboto, sans-serif',
              fill: colors.text 
            }}
            angle={-30} // Rotate labels for better readability
            textAnchor="end"
            height={50} // Increase height for angled labels
            interval={0} // Show all labels
            stroke={colors.text} // Axis line color
          />
          
          {/* Y-axis for dollar amounts */}
          <YAxis
            tickFormatter={formatYAxisTick} // Format Y-axis ticks
            tick={{ 
              fontSize: 12, 
              fontFamily: 'Roboto, sans-serif',
              fill: colors.text 
            }}
            width={80} // Adjust width for formatted labels
            stroke={colors.text} // Axis line color
          />
          
          {/* Custom tooltip for hover details */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Legend for bar identification */}
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px',
              fontFamily: 'Roboto, sans-serif',
              color: colors.text,
            }}
            formatter={(value) => <span style={{ color: colors.text }}>{value}</span>}
          />
          
          {/* Bar for total 'buy' amounts */}
          <Bar
            dataKey="buy_total"
            name="Total Buys ($)"
            fill={colors.buyBar}
            radius={[4, 4, 0, 0]} // Rounded top corners
          />
          
          {/* Bar for total 'sell' amounts */}
          <Bar
            dataKey="sell_total"
            name="Total Sells ($)"
            fill={colors.sellBar}
            radius={[4, 4, 0, 0]} // Rounded top corners
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TradeChart;