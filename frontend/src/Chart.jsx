import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';

// Helper function to determine the year-quarter string (e.g., "2023-Q1")
const getYearQuarter = (dateInput) => {
  if (dateInput === null || typeof dateInput === 'undefined') {
    console.error("getYearQuarter received invalid dateInput:", dateInput);
    return null;
  }

  let dateString = String(dateInput);
  let date;

  if (/^\d{4}-\d{2}$/.test(dateString)) { // Handles "YYYY-MM" format
    date = new Date(dateString + "-01T00:00:00Z");
  } else {
    date = new Date(dateString); // Handles other full date formats
  }

  if (isNaN(date.getTime())) {
    console.error("Invalid date created in getYearQuarter from input:", dateInput);
    return null;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month <= 3) return `${year}-Q1`;
  if (month <= 6) return `${year}-Q2`;
  if (month <= 9) return `${year}-Q3`;
  return `${year}-Q4`;
};

const TradeChart = ({ data }) => {
  const theme = useTheme();

  const quarterlyChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const quarterlyAgg = {};

    data.forEach(item => {
      let dateForQuarterCalculation = item.date; // Prefer 'date' if it exists

      if (typeof dateForQuarterCalculation === 'undefined' || dateForQuarterCalculation === null) {
        dateForQuarterCalculation = item.month_label;
      }
      
      if (typeof dateForQuarterCalculation === 'undefined' || dateForQuarterCalculation === null) {
        dateForQuarterCalculation = item.period;
      }

      if (!item || typeof dateForQuarterCalculation === 'undefined' || dateForQuarterCalculation === null) {
        console.warn("Skipping item due to missing or invalid date field (checked date, month_label, period):", item);
        return; 
      }

      const quarterKey = getYearQuarter(dateForQuarterCalculation); // This will be "YYYY-QX"

      if (!quarterKey) {
        console.warn(`Skipping item, could not determine quarter for date: ${dateForQuarterCalculation}`, item);
        return; 
      }

      if (!quarterlyAgg[quarterKey]) {
        quarterlyAgg[quarterKey] = {
          name: quarterKey, // Store the full "YYYY-QX" for sorting
          Buy: 0,
          Sell: 0,
        };
      }
      quarterlyAgg[quarterKey].Buy += item.buy_total || item.buy || item.Buy || 0;
      quarterlyAgg[quarterKey].Sell += item.sell_total || item.sell || item.Sell || 0;
    });

    // Sort the aggregated data based on the full "YYYY-QX" name
    const sortedAggregatedData = Object.values(quarterlyAgg).sort((a, b) => {
      // a.name and b.name are "YYYY-QX"
      const [yearA, qNumAWithQ] = a.name.split('-');
      const [yearB, qNumBWithQ] = b.name.split('-');
      const qNumA = qNumAWithQ.substring(1); // Extract number from "QX"
      const qNumB = qNumBWithQ.substring(1); // Extract number from "QX"

      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return parseInt(qNumA) - parseInt(qNumB);
    });

    // Now, transform the 'name' property for display on the X-axis to only show "QX"
    return sortedAggregatedData.map(item => ({
      ...item,
      name: item.name.split('-')[1] // Extracts "QX" from "YYYY-QX"
    }));

  }, [data]);

  if (!quarterlyChartData || quarterlyChartData.length === 0) {
     return <p style={{ textAlign: 'center', color: theme.palette.text.secondary, marginTop: '20px' }}>
                No trade data available to display for the selected stock or period.
            </p>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={quarterlyChartData} 
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        {}
        <XAxis dataKey="name" stroke={theme.palette.text.secondary} /> 
        <YAxis
          stroke={theme.palette.text.secondary}
          tickFormatter={value =>
            new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
          formatter={(value, name) => { // 'name' here is 'Buy' or 'Sell' (the dataKey of the Bar)
            const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
            const displayName = name === 'Buy' ? 'Total Buys' : name === 'Sell' ? 'Total Sells' : name;
            return [formattedValue, displayName];
          }}
          
          labelStyle={{ color: theme.palette.text.primary, fontWeight: 'bold' }}
        />
        <Legend wrapperStyle={{ color: theme.palette.text.primary }}/>
        <Bar dataKey="Buy" fill={theme.palette.success.main} name="Total Buys ($)" />
        <Bar dataKey="Sell" fill={theme.palette.error.main} name="Total Sells ($)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TradeChart;