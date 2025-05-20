import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// Helper function to format date for X-axis (optional, Recharts might handle it)
const formatDateTick = (tickItem) => {
  // Assuming tickItem is a date string like 'YYYY-MM-DDTHH:mm:ss.sssZ'
  // or 'YYYY-MM-DD' from Tiingo
  return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

function HistoricalPriceChart({ data, symbol }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Define colors based on theme
  const colors = {
    line: isDarkMode ? '#8ccdff' : '#1976d2',         // Blueish for the line
    grid: isDarkMode ? '#555555' : '#e0e0e0',         // Grid lines
    text: isDarkMode ? '#ffffff' : '#333333',         // Axis text, legend text
    tooltipBg: isDarkMode ? '#333333' : '#ffffff',    // Tooltip background
    tooltipBorder: isDarkMode ? '#555555' : 'rgba(0,0,0,0.1)', // Tooltip border
  };

  if (!data || data.length === 0) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4, p: 2 }}>
        No historical price data available for the selected period.
      </Typography>
    );
  }

  // Prepare data for the chart. Tiingo returns dates like 'YYYY-MM-DDTHH:mm:ss.sssZ'.
  // We might want to ensure 'date' is consistently formatted or parsed if needed by Recharts.
  const chartData = data.map(item => ({
    ...item,
    // 'date' from Tiingo is typically already in a format Recharts can handle for time series.
    // If specific formatting is needed for display in tooltips or axes, it can be done here or via formatters.
    // For XAxis display, you can use the `tickFormatter`.
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload; // Access the full data point
      return (
        <div style={{
          backgroundColor: colors.tooltipBg,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          padding: '8px 12px',
          color: colors.text,
          fontFamily: 'Roboto, sans-serif',
        }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', margin: '0 0 5px 0' }}>
            {formatDateTick(label)} {/* Format date in tooltip */}
          </p>
          <p style={{ fontSize: 12, color: colors.line, margin: '3px 0' }}>
            Close: ${point.close?.toFixed(2)}
          </p>
          <p style={{ fontSize: 10, margin: '3px 0' }}>Open: ${point.open?.toFixed(2)}</p>
          <p style={{ fontSize: 10, margin: '3px 0' }}>High: ${point.high?.toFixed(2)}</p>
          <p style={{ fontSize: 10, margin: '3px 0' }}>Low: ${point.low?.toFixed(2)}</p>
          <p style={{ fontSize: 10, margin: '3px 0' }}>Volume: {point.volume?.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 20, right: 30, left: 20, bottom: 30, // Adjusted bottom margin for angled labels
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateTick}
            tick={{ fontSize: 10, fill: colors.text, fontFamily: 'Roboto, sans-serif' }}
            angle={-30} // Angle labels for better fit
            textAnchor="end"
            height={50} // Increase height to accommodate angled labels
            stroke={colors.text}
          />
          <YAxis
            tickFormatter={(value) => `$${value.toFixed(0)}`} // Adjust precision as needed
            tick={{ fontSize: 10, fill: colors.text, fontFamily: 'Roboto, sans-serif' }}
            domain={['auto', 'auto']} // Auto-adjust Y-axis domain
            stroke={colors.text}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '12px',
              fontFamily: 'Roboto, sans-serif',
              color: colors.text,
            }}
            formatter={(value) => <span style={{ color: colors.text }}>{value}</span>}
          />
          <Line
            type="linear"
            dataKey="close" // You can also use 'adjClose' if available and preferred
            stroke={colors.line}
            strokeWidth={2}
            dot={false} // No dots on the line for a cleaner look
            activeDot={{ r: 6 }} // Style for the dot when hovered
            name={`Close Price`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HistoricalPriceChart;