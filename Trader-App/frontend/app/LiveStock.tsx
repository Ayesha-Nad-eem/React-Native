import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";

interface StockData {
  symbol: string;
  price: number;
  history: number[];
};
const SYMBOLS = [
  "AAPL", "TSLA", "GOOGL", "AMZN", "MSFT",
  "NVDA", "META", "NFLX", "INTC", "AMD"
];
const API_KEY = "d3tmvbhr01qigeg3uih0d3tmvbhr01qigeg3uihg";

type SparkBarsProps = {
  data: number[];
  color: string;
  maxBars?: number;
};

function SparkBars({ data, color, maxBars = 25 }: SparkBarsProps) {
  const recent = data.slice(-maxBars);
  const max = Math.max(...recent);
  const min = Math.min(...recent);
  const range = max - min || 1;

  return (
    <View style={styles.sparkContainer}>
      {recent.map((v, i) => {
        const normalized = (v - min) / range; // 0..1
        const height = 6 + normalized * 36; // px: 6..42
        return (
          <View
            key={i}
            accessible
            accessibilityLabel={`point ${i} value ${v}`}
            style={[styles.bar, { height, backgroundColor: color }]}
          />
        );
      })}
    </View>
  );
}

export default function StockScreen() {
  const [stocks, setStocks] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);

    ws.onopen = () => {
      console.log("✅ Connected to Finnhub WebSocket");
      SYMBOLS.forEach((symbol) => {
        ws.send(JSON.stringify({ type: "subscribe", symbol }));
      });
      setLoading(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "trade") {
        setStocks((prevStocks) => {
          const updates = { ...prevStocks };
          data.data.forEach((trade: any) => {
            const { s: symbol, p: price } = trade;
            if (!updates[symbol]) {
              updates[symbol] = { symbol, price, history: [price] };
            } else {
              updates[symbol].price = price;
              updates[symbol].history = [
                ...updates[symbol].history.slice(-25), // keep last 25 values
                price,
              ];
            }
          });
          return updates;
        });
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("🔴 WebSocket closed");

    return () => ws.close();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007aff" />
        <Text className="mt-3 text-gray-700 text-base">
          Connecting to live market...
        </Text>
      </View>
    );
  }

  const stockArray = Object.values(stocks);

  return (
    <View className="flex-1 bg-gray-50 pt-14 px-5">
      <Text className="text-2xl font-bold mb-5 text-center text-gray-800">
        📈 Live Stock Prices
      </Text>

      <FlatList
        data={stockArray}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => {
          const color =
            item.price >= item.history[0] ? "text-green-600" : "text-red-600";
          const chartColor =
            item.price >= item.history[0] ? "#22c55e" : "#ef4444";

          return (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-semibold">{item.symbol}</Text>
                <Text className={`text-lg font-bold ${color}`}>
                  ${item.price.toFixed(2)}
                </Text>
              </View>

              {/* Simple bar-sparkline (dependency-free) */}
              {item.history.length > 1 && (
                <SparkBars data={item.history} color={chartColor} />
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sparkContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor: '#ccc',
  },
});
