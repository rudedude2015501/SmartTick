# app/utils.py

# Map Finnhub metric keys to StockMetric model column names
METRIC_MAP = {
    "10DayAverageTradingVolume":   "ten_day_avg_volume",
    "13WeekPriceReturnDaily":      "thirteen_week_return",
    "52WeekHigh":                  "fifty_two_wk_high",
    "52WeekHighDate":              "fifty_two_wk_high_date",
    "52WeekLow":                   "fifty_two_wk_low",
    "52WeekLowDate":               "fifty_two_wk_low_date",
    "beta":                        "beta",
    "peTTM":                       "pe_ttm",
    "pb":                          "pb",
    "psTTM":                       "ps_ttm",
    "currentDividendYieldTTM":     "dividend_yield_ttm",
    "currentRatioQuarterly":       "current_ratio_quarterly",
    "quickRatioQuarterly":         "quick_ratio_quarterly",
    "roeTTM":                      "roe_ttm",
    "roaTTM":                      "roa_ttm",
    "epsTTM":                      "eps_ttm",
    "revenuePerShareTTM":          "rev_per_share_ttm",
    "revenueGrowthTTMYoy":         "rev_growth_ttm_yoy",
    "epsGrowthTTMYoy":             "eps_growth_ttm_yoy",
}


def extract_key_metrics(finnhub_response: dict) -> dict:
    """
    Pull out only the metrics we store in StockMetric.
    Returns a flat dict whose keys match StockMetric attributes.
    """
    metric = finnhub_response.get("metric", {})
    filtered = {}

    for api_key, attr_name in METRIC_MAP.items():
        # grab the value (or None if missing)
        filtered[attr_name] = metric.get(api_key)

    return filtered
