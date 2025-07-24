import { createContext, useContext, useEffect, useState } from "react";
import { useBLEContext } from "./BLEContext";
import { fromHex } from "@mysten/sui/utils";
import { STATE } from "../hooks/useBluetooth";

interface AuthContextApi {
  user: string | null;
  isAuthenticated: boolean;
  balance: number | null;
  suiUsdPrice: number | null;
  fetchBalanceAndPrice: () => Promise<void>;
}

const AuthContext = createContext<AuthContextApi | null>(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [suiUsdPrice, setSuiUsdPrice] = useState<number | null>(null);

  // Get data from BLE context
  const { publicKey, connectedDevice, client, changeState } = useBLEContext();

  useEffect(() => {
    // When BLE gets public key, update auth state
    if (publicKey) {
      setUser(publicKey);
      setIsAuthenticated(true);
      fetchBalanceAndPrice();
    }
  }, [publicKey]);

  const fetchBalanceAndPrice = async () => {
    if (!client || !publicKey) return;

    try {
      const coins = await client.getCoins({ owner: publicKey });
      const totalMist = coins.data.reduce(
        (sum, coin) => sum + Number(coin.balance),
        0,
      );
      const totalSui = totalMist / 1e9;
      setBalance(totalSui);

      const priceResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd",
      );
      const priceData = await priceResponse.json();
      const suiPrice = priceData.sui.usd;
      setSuiUsdPrice(suiPrice);
    } catch (error) {
      console.error("Error fetching balance or price:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        balance,
        suiUsdPrice,
        fetchBalanceAndPrice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
};
