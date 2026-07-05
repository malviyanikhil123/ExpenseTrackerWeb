import { useState } from "react"
import { AlertCircle, Calendar, FolderOpen, TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet, PiggyBank, PieChart as PieIcon, BarChart3, LineChart as LineIcon } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

import { useAnalyticsReport } from "../hooks/useAnalytics"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { useCurrency } from "../../../hooks/useCurrency"

const COLOR_SCHEME = [
  "#706677",
  "#565264",
  "#9ca3af",
  "#d1d5db",
  "#e5e7eb",
  "#f3f4f6",
]

export default function AnalyticsPage() {
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const { format: formatMoney } = useCurrency()
  
  const queryParams = {
    startDate: filterStartDate ? new Date(filterStartDate).toISOString() : undefined,
    endDate: filterEndDate ? new Date(filterEndDate).toISOString() : undefined,
  }

  const { data, isLoading, isError, refetch } = useAnalyticsReport(queryParams)

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-danger/10 bg-danger/5 rounded-[16px] max-w-2xl mx-auto mt-12">
        <AlertCircle className="size-12 text-danger mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Failed to fetch Analytics reports</h2>
        <p className="text-sm text-gray-500 mb-6">There was an error communicating with the database.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry
        </CustomButton>
      </div>
    )
  }

  const report = {
    income: data?.income ?? 0,
    expense: data?.expense ?? 0,
    balance: data?.balance ?? 0,
    savings: data?.savings ?? 0,
    monthlyTrend: data?.monthlyTrend ?? [],
    categoryBreakdown: data?.categoryBreakdown ?? [],
    accountBreakdown: data?.accountBreakdown ?? [],
  }

  const cards = [
    {
      title: "Total Income",
      amount: report.income,
      icon: <ArrowDownLeft className="size-5 text-success" />,
      color: "text-success",
    },
    {
      title: "Total Expense",
      amount: report.expense,
      icon: <ArrowUpRight className="size-5 text-danger" />,
      color: "text-danger",
    },
    {
      title: "Net Balance",
      amount: report.balance,
      icon: <Wallet className="size-5 text-secondary" />,
      color: "text-foreground",
    },
    {
      title: "Savings Ratio",
      amount: report.savings,
      icon: <PiggyBank className="size-5 text-primary" />,
      color: "text-foreground",
      isPercent: true,
    },
  ]

  // Mock aggregates if empty
  const trendData = report.monthlyTrend.length > 0 ? report.monthlyTrend : [
    { month: "Jan", income: 4200, expense: 3100 },
    { month: "Feb", income: 3800, expense: 2800 },
    { month: "Mar", income: 4900, expense: 3600 },
    { month: "Apr", income: 5100, expense: 4100 },
    { month: "May", income: 6000, expense: 4500 },
  ]

  const categoryPieData = report.categoryBreakdown.length > 0
    ? report.categoryBreakdown.map((c: any, index: number) => ({
        name: c.categoryName,
        value: Number(c.amount),
        color: COLOR_SCHEME[index % COLOR_SCHEME.length],
      }))
    : [
        { name: "Food & Drinks", value: 350, color: "#706677" },
        { name: "Transport", value: 120, color: "#565264" },
        { name: "Bills", value: 200, color: "#9ca3af" },
        { name: "Others", value: 90, color: "#e5e7eb" },
      ]

  const accountBarData = report.accountBreakdown.length > 0
    ? report.accountBreakdown.map((a: any, index: number) => ({
        name: a.accountName,
        amount: Number(a.balance),
        color: COLOR_SCHEME[index % COLOR_SCHEME.length],
      }))
    : [
        { name: "Chase Bank", amount: 5400, color: "#706677" },
        { name: "Cash Wallet", amount: 620, color: "#565264" },
        { name: "Robinhood", amount: 4800, color: "#9ca3af" },
      ]

  const hasData = report.income > 0 || report.expense > 0

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      
      {/* Header (Section 76) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Examine monthly cash flows, visual savings trends, and allocations.</p>
        </div>

        {/* Date Filter Panel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="h-9 px-3 border border-border rounded-[10px] text-xs outline-none focus:border-primary bg-card text-foreground transition-colors font-sans"
          />
          <span className="text-xs text-muted-foreground self-center hidden sm:inline">to</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="h-9 px-3 border border-border rounded-[10px] text-xs outline-none focus:border-primary bg-card text-foreground transition-colors font-sans"
          />
          {(filterStartDate || filterEndDate) && (
            <button
              onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }}
              className="text-2xs font-bold text-danger hover:underline ml-1.5"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary metrics cards (Section 76) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-3 text-card-foreground">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</span>
              <div className="p-2 rounded-full bg-muted border border-border">{card.icon}</div>
            </div>
             <span className={`text-2xl font-bold ${card.color}`}>
              {card.isPercent ? `${card.amount.toFixed(0)}%` : formatMoney(card.amount)}
            </span>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="h-96 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-2 border border-dashed border-border bg-card rounded-[16px] p-8">
          <FolderOpen className="size-12" />
          <h4 className="font-semibold text-foreground text-sm">No analytics details recorded</h4>
          <p className="max-w-md mt-1 leading-normal text-muted-foreground">
            Log transactions, category budgets, or savings records first to compile analytical charts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          
          {/* Cashflow Monthly Trend (Line/Area Chart) */}
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-4 text-card-foreground">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <LineIcon className="size-5 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">Monthly Cash Flow Trend</h3>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="income" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="expense" stroke="#DC2626" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories allocation donut (Pie chart) */}
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-4 text-card-foreground">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <PieIcon className="size-5 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">Expenses Category allocation</h3>
            </div>
            <div className="h-[260px] w-full flex items-center justify-center">
              <div className="flex items-center justify-between w-full px-4">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                 <div className="flex flex-col gap-2">
                  {categoryPieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-semibold">{d.name} ({formatMoney(d.value)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account balance allocation (Bar Chart) */}
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-4 text-card-foreground">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <BarChart3 className="size-5 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">Account Balance Allocation</h3>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    {accountBarData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse font-sans">
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
        <div className="h-10 w-44 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-[16px] p-6 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div className="bg-white border border-gray-200 rounded-[16px] h-80" />
        <div className="bg-white border border-gray-200 rounded-[16px] h-80" />
      </div>
    </div>
  )
}
