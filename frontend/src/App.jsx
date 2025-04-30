// SmartTick/frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import TradeChart from './Chart'; // Import the chart component
import './App.css'; // Ensure basic CSS is imported

// Get API URL from environment variable (set by Docker/Vite)
// Provides a fallback for local development outside Docker
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  // State variables
  const [symbol, setSymbol] = useState(''); // Current value in the input field
  const [searchSymbol, setSearchSymbol] = useState(''); // The symbol that was last searched for
  const [chartData, setChartData] = useState([]); // Data for the chart, fetched from API
  const [isLoading, setIsLoading] = useState(false); // Tracks if an API call is in progress
  const [error, setError] = useState(null); // Stores any error message from the API call

  // Function to fetch trade summary data from the backend API
  // useCallback ensures the function reference is stable unless dependencies change
  const fetchTradeSummary = useCallback(async (symbolToFetch) => {
    // Don't fetch if the symbol is empty
    if (!symbolToFetch) {
      setChartData([]); // Clear chart
      setError(null); // Clear errors
      setSearchSymbol(''); // Clear the last searched symbol
      return;
    }

    console.log(`Fetching data for symbol: ${symbolToFetch} from ${apiUrl}/api/trades/summary/${symbolToFetch}`);
    setIsLoading(true); // Set loading state to true
    setError(null); // Clear previous errors
    setChartData([]); // Clear previous chart data

    try {
      // Make the API call
      const response = await fetch(`${apiUrl}/api/trades/summary/${symbolToFetch}`);

      // Check if the response status indicates an error
      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        // Try to parse a JSON error message from the backend response body
        try {
            const errData = await response.json();
            // Use the backend's error message if available
            errorMsg = errData.error || errorMsg;
        } catch (jsonError) {
            // If the response body isn't JSON or is empty, stick with the status text
            console.warn("Could not parse error response as JSON:", jsonError);
        }
        throw new Error(errorMsg); // Throw an error to be caught below
      }

      // Parse the successful JSON response
      const data = await response.json();
      console.log("Received data:", data);
      setChartData(data); // Update chart data state

    } catch (err) {
      // Handle any errors during fetch or processing
      console.error("Failed to fetch trade summary:", err);
      setError(err.message || 'Failed to fetch data. Check network or backend server.'); // Set the error message state
      setChartData([]); // Ensure chart is cleared on error
    } finally {
      // This block always runs, regardless of success or error
      setIsLoading(false); // Set loading state back to false
    }
  }, []); // Empty dependency array means this function is created once

  // Handler for the search form submission
  const handleSearch = (event) => {
    event.preventDefault(); // Prevent default form submission (which causes page reload)
    const trimmedSymbol = symbol.trim().toUpperCase(); // Trim whitespace and convert to uppercase
    if (trimmedSymbol) {
        setSearchSymbol(trimmedSymbol); // Store the symbol being searched
        fetchTradeSummary(trimmedSymbol); // Call the fetch function
    }
  };

  // Handler for changes in the input field
  const handleInputChange = (event) => {
    setSymbol(event.target.value); // Update the symbol state as the user types
  };

  // --- Render Logic ---
  // Helper function to determine what content to show in the chart area
  const renderChartAreaContent = () => {
    if (isLoading) {
      return <div className="text-center text-blue-600 p-4">Loading chart data...</div>;
    }
    if (error) {
      return (
        <div className="text-center text-red-600 mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p>Error: {error}</p>
        </div>
      );
    }
    if (chartData.length > 0) {
      return (
        <>
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-700">
            Monthly Trade Summary for: {searchSymbol}
          </h2>
          {/* Render the chart component with the fetched data */}
          <TradeChart data={chartData} />
        </>
      );
    }
    if (searchSymbol) {
      // If a search was performed but resulted in no data and no error
      return (
        <div className="text-center text-gray-500 p-4">
          No trade data found for symbol "{searchSymbol}". It might be an invalid symbol or have no recorded trades.
        </div>
      );
    }
    // Default state before any search or if search was cleared
    return (
      <div className="text-center text-gray-500 p-4">
        Enter a stock symbol (e.g., AAPL, MSFT) above and click Search to view the trade summary.
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans"> {/* Added font-sans */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">SmartTick</h1>
        <p className="text-gray-600 mt-1">Politician Trade Visualizer</p>
      </header>

      {/* Search Form */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <label htmlFor="symbolInput" className="sr-only">Stock Symbol</label> {/* Added label for accessibility */}
          <input
            id="symbolInput" // Added id to link label
            type="text"
            value={symbol}
            onChange={handleInputChange}
            placeholder="Enter Stock Symbol (e.g., AAPL)"
            className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            aria-label="Stock Symbol" // Aria-label still useful
            required // Basic HTML5 validation
          />
          <button
            type="submit"
            disabled={isLoading || !symbol.trim()} // Disable button when loading or input is empty/whitespace
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Chart Display Area */}
      <div className="max-w-4xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-md min-h-[200px] flex flex-col justify-center"> {/* Added min-height and flex centering for messages */}
        {renderChartAreaContent()} {/* Render loading/error/chart/message */}
      </div>

      <footer className="text-center mt-8 text-gray-500 text-sm">
        Data aggregated from public politician trade filings. Amounts are approximate based on reported value ranges.
      </footer>
    </div>
  );
}

export default App;
