import { useProfileDetails } from "../features/profile/hooks/useProfile"

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
}

export function formatCurrency(amount: number | string, currency: string = "USD") {
  const symbol = CURRENCY_SYMBOLS[currency] || "$"
  const num = typeof amount === "number" ? amount : Number(amount)
  
  if (isNaN(num)) {
    return `${symbol}0.00`
  }

  return `${symbol}${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function useCurrency() {
  const { data: profile } = useProfileDetails()
  const currency = profile?.currency || localStorage.getItem("currency") || "USD"

  const format = (amount: number | string) => {
    return formatCurrency(amount, currency)
  }

  const symbol = CURRENCY_SYMBOLS[currency] || "$"

  return { currency, format, symbol }
}
