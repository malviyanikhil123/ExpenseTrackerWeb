import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  AlertCircle,
  FolderOpen,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  Wallet,
  Users,
  CreditCard,
  PieChart as PieIcon,
  BarChart4,
  Edit,
  Plane,
  Receipt
} from "lucide-react"
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts"
import { toast } from "sonner"

import { api } from "../../../lib/api"
import { useAuthStore } from "../../../store/authStore"
import { useAccountsList } from "../../accounts/hooks/useAccounts"
import { useCategoriesList } from "../../categories/hooks/useCategories"
import { useAnalyticsReport } from "../../analytics/hooks/useAnalytics"
import { useTransactionsList } from "../../transactions/hooks/useTransactions"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { Badge } from "../../../components/feedback/FeedbackStates"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { CustomInput, CurrencyInput } from "../../../components/inputs/CustomInput"
import { useCurrency } from "../../../hooks/useCurrency"
import { CustomSelect } from "../../../components/inputs/CustomSelect"

interface DashboardData {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  pendingLent: number
  pendingBorrow: number
  recentTransactions: any[]
  recentDebts: any[]
  monthlySummary: any[]
  totalAssets: number
  totalOutstanding: number
  netWorth: number
  monthlyIncome: number
  monthlyExpense: number
  cashFlow: number
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-popover border border-border rounded-[10px] shadow-lg px-3 py-2 text-xs font-sans">
      {label && <p className="text-muted-foreground font-semibold mb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-foreground font-medium capitalize">{entry.name}:</span>
          <span className="text-foreground font-bold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const { format: formatMoney } = useCurrency()

  const [period, setPeriod] = useState<"MONTH" | "WEEK" | "YEAR">("MONTH")
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      const response = await api.get(`/dashboard`, {
        params: { period },
      })
      return response.data.data
    },
  })

  const { data: analyticsData } = useAnalyticsReport({ period: "YEAR" })

  const { data: accounts = [] } = useAccountsList()
  const { data: categories = [] } = useCategoriesList()
  const { data: transactions = [] } = useTransactionsList()

  const [txDesc, setTxDesc] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [txAccountId, setTxAccountId] = useState("")
  const [txCategoryId, setTxCategoryId] = useState("")

  const [accName, setAccName] = useState("")
  const [accBalance, setAccBalance] = useState("")

  const [debtParty, setDebtParty] = useState("")
  const [debtAmount, setDebtAmount] = useState("")
  const [debtType, setDebtType] = useState<"LENT" | "BORROW">("LENT")
  const [debtAccountId, setDebtAccountId] = useState("")

  const handleOpenTx = () => {
    setTxDesc("")
    setTxAmount("")
    setTxType("EXPENSE")
    const defAcc = accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || ""
    setTxAccountId(defAcc)

    const matchedCats = categories.filter((c) => c.type === "EXPENSE")
    setTxCategoryId(matchedCats[0]?.id || categories[0]?.id || "")

    setIsTxDialogOpen(true)
  }

  const handleOpenDebt = () => {
    setDebtParty("")
    setDebtAmount("")
    setDebtType("LENT")
    const defAcc = accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || ""
    setDebtAccountId(defAcc)
    setIsDebtDialogOpen(true)
  }

  const handleTxTypeChange = (type: "INCOME" | "EXPENSE") => {
    setTxType(type)
    const matchedCats = categories.filter((c) => c.type === type)
    setTxCategoryId(matchedCats[0]?.id || categories[0]?.id || "")
  }

  const txMutation = useMutation({
    mutationFn: (newTx: any) => api.post("/transactions", newTx),
    onSuccess: () => {
      toast.success("Transaction added successfully!")
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setIsTxDialogOpen(false)
      setTxDesc("")
      setTxAmount("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add transaction")
    }
  })

  const accMutation = useMutation({
    mutationFn: (newAcc: any) => api.post("/accounts", newAcc),
    onSuccess: async (response) => {
      toast.success("Account created successfully!")
      const createdAccount = response.data?.data
      if (createdAccount) {
        queryClient.setQueriesData({ queryKey: ["accounts"] }, (current: any) => {
          if (!Array.isArray(current)) {
            return current
          }

          return [...current, createdAccount]
        })
      }
      await queryClient.refetchQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setIsAccountDialogOpen(false)
      setAccName("")
      setAccBalance("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create account")
    }
  })

  const debtMutation = useMutation({
    mutationFn: (newDebt: any) => api.post("/debts", newDebt),
    onSuccess: () => {
      toast.success("Debt record added!")
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setIsDebtDialogOpen(false)
      setDebtParty("")
      setDebtAmount("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to record debt")
    }
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-danger/10 bg-danger/5 rounded-[16px] max-w-2xl mx-auto mt-12">
        <AlertCircle className="size-12 text-danger mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Failed to fetch dashboard metrics</h2>
        <p className="text-sm text-gray-500 mb-6">There was an error communicating with the backend API service.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry Request
        </CustomButton>
      </div>
    )
  }

  const dashboardData = {
    totalBalance: data?.totalBalance ?? 0,
    totalIncome: data?.totalIncome ?? 0,
    totalExpense: data?.totalExpense ?? 0,
    pendingLent: data?.pendingLent ?? 0,
    pendingBorrow: data?.pendingBorrow ?? 0,
    recentTransactions: data?.recentTransactions ?? [],
    recentDebts: data?.recentDebts ?? [],
    monthlySummary: data?.monthlySummary ?? [],
    totalAssets: data?.totalAssets ?? 0,
    totalOutstanding: data?.totalOutstanding ?? 0,
    netWorth: data?.netWorth ?? 0,
    monthlyIncome: data?.monthlyIncome ?? 0,
    monthlyExpense: data?.monthlyExpense ?? 0,
    cashFlow: data?.cashFlow ?? 0,
  }

  const balanceSummaries = [
    {
      id: "net_worth",
      title: "Net Worth",
      amount: dashboardData.netWorth,
      icon: <DollarSign className="size-5 text-secondary" />,
      color: "text-foreground",
      action: () => navigate("/accounts"),
    },
    {
      id: "assets",
      title: "Total Assets",
      amount: dashboardData.totalAssets,
      icon: <Wallet className="size-5 text-success" />,
      color: "text-success",
      action: () => navigate("/accounts"),
    },
    {
      id: "outstanding",
      title: "Outstanding Credit",
      amount: dashboardData.totalOutstanding,
      icon: <CreditCard className="size-5 text-danger" />,
      color: "text-danger",
      action: () => navigate("/accounts"),
    },
    {
      id: "debts",
      title: "Pending Debts",
      amount: dashboardData.pendingLent - dashboardData.pendingBorrow,
      icon: <Users className="size-5 text-warning" />,
      color: "text-foreground",
      action: () => navigate("/debts"),
    },
  ]

  const flowSummaries = [
    {
      id: "income",
      title: "Monthly Income",
      amount: dashboardData.monthlyIncome,
      icon: <ArrowDownLeft className="size-5 text-success" />,
      color: "text-success",
      action: () => navigate("/transactions", { state: { filterType: "INCOME" } }),
    },
    {
      id: "expense",
      title: "Monthly Expenses",
      amount: dashboardData.monthlyExpense,
      icon: <ArrowUpRight className="size-5 text-primary" />,
      color: "text-primary",
      action: () => navigate("/transactions", { state: { filterType: "EXPENSE" } }),
    },
    {
      id: "cash_flow",
      title: "Cash Flow",
      amount: dashboardData.cashFlow,
      icon: <ArrowLeftRight className="size-5 text-secondary" />,
      color: dashboardData.cashFlow >= 0 ? "text-success" : "text-danger",
      action: () => navigate("/transactions"),
    },
  ]

  const compareData = [
    { name: "Income", amount: dashboardData.totalIncome, color: "var(--chart-income)" },
    { name: "Expenses", amount: dashboardData.totalExpense, color: "var(--chart-expenses)" },
  ]

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthTxs = transactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const thisMonthIncome = thisMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
  const thisMonthExpense = thisMonthTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
  const thisMonthSavings = thisMonthIncome - thisMonthExpense;

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthTxs = transactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });
  const lastMonthIncome = lastMonthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
  const lastMonthExpense = lastMonthTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
  const lastMonthSavings = lastMonthIncome - lastMonthExpense;

  let savingsMessage = `Your net savings this month is ${formatMoney(Math.abs(thisMonthSavings))}.`;
  if (thisMonthSavings > lastMonthSavings && lastMonthSavings > 0) {
    const pct = Math.round(((thisMonthSavings - lastMonthSavings) / lastMonthSavings) * 100);
    savingsMessage = `You've saved ${pct}% more than last month.`;
  } else if (thisMonthSavings > 0) {
    savingsMessage = `You've saved ${formatMoney(thisMonthSavings)} this month. Keep it up!`;
  } else if (thisMonthSavings < 0) {
    savingsMessage = `Your net savings this month is negative. Let's analyze your cash flows to balance.`;
  }

  const liquidAssets = accounts.filter(a => a.type !== 'CREDIT_CARD').reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  const targetGoal = liquidAssets <= 0 ? 50000 : liquidAssets < 15000 ? 15000 : liquidAssets < 50000 ? 50000 : liquidAssets < 100000 ? 100000 : Math.ceil(liquidAssets / 50000) * 50000;
  const savingsProgress = Math.max(0, liquidAssets);
  const goalProgressPct = Math.min(100, Math.round((savingsProgress / targetGoal) * 100));

  const pieData = [
    { name: "Food & Drinks", value: 35, color: "var(--chart-expenses)" },
    { name: "Transport", value: 20, color: "var(--chart-income)" },
    { name: "Bills & Utilities", value: 25, color: "var(--chart-savings)" },
    { name: "Others", value: 20, color: "var(--chart-transfers)" },
  ]

  // Set up Cash Flow Chart data dynamically
  const getTrendData = () => {
    if (!transactions || transactions.length === 0) {
      return [
        { month: "May", Income: 3500, Expenses: 2200 },
        { month: "Jun", Income: 4200, Expenses: 2400 },
        { month: "Jul", Income: 3800, Expenses: 2900 },
        { month: "Aug", Income: 4900, Expenses: 2100 },
        { month: "Sep", Income: 4700, Expenses: 2500 },
        { month: "Oct", Income: 5800, Expenses: 2700 }
      ];
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months: Array<{ monthKey: string; monthLabel: string; Income: number; Expenses: number }> = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push({
        monthKey: `${d.getFullYear()}-${d.getMonth()}`,
        monthLabel: months[d.getMonth()],
        Income: 0,
        Expenses: 0
      });
    }

    transactions.forEach(t => {
      const txDate = new Date(t.transactionDate);
      const key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
      const bucket = last6Months.find(m => m.monthKey === key);
      if (bucket) {
        if (t.type === "INCOME") {
          bucket.Income += Number(t.amount);
        } else if (t.type === "EXPENSE") {
          bucket.Expenses += Number(t.amount);
        }
      }
    });

    return last6Months.map(m => ({
      month: m.monthLabel,
      Income: m.Income,
      Expenses: m.Expenses
    }));
  };

  const trendData = getTrendData();

  // Set up Expense Allocations Donut chart data
  const getExpenseAllocationData = () => {
    const expenses = transactions.filter(t => t.type === "EXPENSE");
    if (expenses.length === 0) {
      return {
        total: 4820,
        pieData: [
          { name: "Housing & Utilities", value: 2100, color: "#006c49" },
          { name: "Food & Lifestyle", value: 1250, color: "#10b981" },
          { name: "Transportation", value: 640, color: "#515f74" },
          { name: "Others", value: 830, color: "#cbd5e1" }
        ]
      };
    }

    const catSums: Record<string, number> = {};
    let total = 0;
    expenses.forEach(t => {
      const catName = t.category?.name || "Others";
      catSums[catName] = (catSums[catName] || 0) + Number(t.amount);
      total += Number(t.amount);
    });

    const sortedCats = Object.entries(catSums).sort((a, b) => b[1] - a[1]);
    const top3 = sortedCats.slice(0, 3);
    const othersVal = sortedCats.slice(3).reduce((sum, item) => sum + item[1], 0);

    const colors = ["#006c49", "#10b981", "#515f74", "#cbd5e1"];
    const pieData = top3.map(([name, val], idx) => ({
      name,
      value: val,
      color: colors[idx]
    }));

    if (othersVal > 0 || top3.length < sortedCats.length) {
      pieData.push({
        name: "Others",
        value: othersVal || 0,
        color: "#cbd5e1"
      });
    }

    return { total, pieData };
  };

  const allocation = getExpenseAllocationData();

  // Set up Recent Activity rows data
  const recentTransactionsList = transactions.length > 0
    ? transactions.slice(0, 4).map((t: any) => ({
        id: t.id,
        note: t.note || t.category?.name || "Transaction",
        type: t.type,
        categoryName: t.category?.name || (t.type === "INCOME" ? "Income" : "Expense"),
        timeStr: format(new Date(t.transactionDate), "d MMM yyyy"),
        amount: Number(t.amount),
        accountName: t.account?.name || "Visa ...4291"
      }))
    : [
        {
          id: "mock1",
          note: "Whole Foods Market",
          type: "EXPENSE",
          categoryName: "Grocery",
          timeStr: "2 hours ago",
          amount: 142.50,
          accountName: "Visa ...4291"
        },
        {
          id: "mock2",
          note: "Monthly Salary Deposit",
          type: "INCOME",
          categoryName: "Income",
          timeStr: "Yesterday",
          amount: 8400.00,
          accountName: "Checking ...0054"
        },
        {
          id: "mock3",
          note: "Supercharger Station",
          type: "EXPENSE",
          categoryName: "Transportation",
          timeStr: "Oct 14, 2023",
          amount: 42.10,
          accountName: "Visa ...4291"
        },
        {
          id: "mock4",
          note: "Equinox Fitness Club",
          type: "EXPENSE",
          categoryName: "Subscription",
          timeStr: "Oct 12, 2023",
          amount: 250.00,
          accountName: "Mastercard ...8812"
        }
      ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Welcome Header */}
      <section className="text-left select-none">
        <h2 className="text-[32px] leading-[40px] font-bold text-foreground mb-1">
          Welcome back, {user?.name || "Alex"}
        </h2>
        <p className="text-[16px] leading-[24px] text-secondary font-medium font-sans">
          Your financial health is looking strong this month. <span className="text-primary font-bold">{savingsMessage}</span>
        </p>
      </section>

      {/* Balance Sheet Summary */}
      <section className="text-left select-none">
        <p className="text-[12px] font-bold text-secondary uppercase tracking-wider mb-3">Balance Sheet Summary</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Net Worth Card */}
          <div
            onClick={() => navigate("/accounts")}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer text-left flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <span className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <Wallet className="size-5 text-primary" />
              </span>
              <span className="text-[12px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+4.2%</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Net Worth</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{formatMoney(dashboardData.netWorth)}</p>
            </div>
          </div>

          {/* Total Assets Card */}
          <div
            onClick={() => navigate("/accounts")}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer text-left flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <span className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="size-5 text-primary" />
              </span>
              <span className="text-[12px] font-medium text-secondary">Updated 2m ago</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Total Assets</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{formatMoney(dashboardData.totalAssets)}</p>
            </div>
          </div>

          {/* Outstanding Credit Card */}
          <div
            onClick={() => navigate("/accounts")}
            className="bg-card border border-border border-l-4 border-l-[#a43a3a] rounded-xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer text-left flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <span className="p-2 bg-[#a43a3a]/10 rounded-lg flex items-center justify-center">
                <CreditCard className="size-5 text-[#a43a3a]" />
              </span>
              <span className="text-[12px] font-semibold text-[#a43a3a]">Next due: Oct 25</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Outstanding Credit</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{formatMoney(dashboardData.totalOutstanding)}</p>
            </div>
          </div>

          {/* Pending Debts Card */}
          <div
            onClick={() => navigate("/debts")}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer text-left flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <span className="p-2 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="size-5 text-secondary" />
              </span>
              <span className="text-[12px] font-medium text-secondary">
                {dashboardData.recentDebts.length} active item{dashboardData.recentDebts.length === 1 ? "" : "s"}
              </span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Pending Debts</p>
              <p className="text-[24px] font-bold text-foreground mt-1">
                {formatMoney(dashboardData.pendingLent - dashboardData.pendingBorrow)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Cash Flow Performance */}
      <section className="text-left select-none">
        <p className="text-[12px] font-bold text-secondary uppercase tracking-wider mb-3">Monthly Cash Flow Performance</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Income Card */}
          <div
            onClick={() => navigate("/transactions", { state: { filterType: "INCOME" } })}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 relative text-left"
          >
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Monthly Income</p>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ArrowDownLeft className="size-4" />
              </div>
            </div>
            <p className="text-[28px] font-bold text-primary">{formatMoney(dashboardData.monthlyIncome)}</p>
          </div>

          {/* Monthly Expenses Card */}
          <div
            onClick={() => navigate("/transactions", { state: { filterType: "EXPENSE" } })}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 relative text-left"
          >
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Monthly Expenses</p>
              <div className="w-8 h-8 rounded-full bg-[#a43a3a]/10 flex items-center justify-center text-[#a43a3a]">
                <ArrowUpRight className="size-4" />
              </div>
            </div>
            <p className="text-[28px] font-bold text-[#a43a3a]">{formatMoney(dashboardData.monthlyExpense)}</p>
          </div>

          {/* Cash Flow Card */}
          <div
            onClick={() => navigate("/transactions")}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 relative text-left"
          >
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Cash Flow</p>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ArrowLeftRight className="size-4" />
              </div>
            </div>
            <p className="text-[28px] font-bold text-primary">{formatMoney(dashboardData.cashFlow)}</p>
          </div>
        </div>
      </section>


      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 select-none">
        {/* Cash Flow Chart */}
        <div className="col-span-12 lg:col-span-8 bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col justify-between min-h-[440px]">
          <div className="flex justify-between items-center mb-6">
            <div className="text-left">
              <h3 className="text-[20px] font-bold text-foreground">Cash Flow Analysis</h3>
              <p className="text-[14px] text-secondary">Visualizing income vs expenses over the last 6 months</p>
            </div>
            <div className="flex gap-2">
              <button className="text-[14px] font-medium bg-muted px-3 py-1 rounded-full text-secondary">6 Months</button>
              <button className="text-[14px] font-medium hover:bg-muted px-3 py-1 rounded-full text-secondary transition-colors cursor-pointer">1 Year</button>
            </div>
          </div>

          <div className="relative h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={6}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(108, 122, 113, 0.15)" />
                <XAxis dataKey="month" stroke="#515f74" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis hide={true} />
                 <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                <Bar dataKey="Income" fill="#006c49" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="Expenses" fill="rgba(0, 108, 73, 0.2)" radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-6 mt-4 pt-4 border-t border-border/40 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#006c49]"></span>
              <span className="text-[12px] font-medium text-secondary">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#006c49]/20"></span>
              <span className="text-[12px] font-medium text-secondary">Expenses</span>
            </div>
          </div>
        </div>

        {/* Expense Allocations Pie Chart */}
        <div className="col-span-12 lg:col-span-4 bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col justify-between min-h-[440px]">
          <h3 className="text-[20px] font-bold text-foreground mb-4 text-left">Expense Allocations</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            <div className="w-[180px] h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {allocation.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                   <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[12px] font-medium text-secondary uppercase tracking-wider">Total Spent</p>
              <p className="text-[20px] font-bold text-foreground">{formatMoney(allocation.total)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {allocation.pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span className="text-secondary">{d.name}</span>
                </div>
                <span className="font-bold text-foreground">{formatMoney(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Savings Goal Row */}
      <div className="grid grid-cols-12 gap-6 select-none">
        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-8 bg-card border border-border shadow-sm rounded-xl p-6 overflow-hidden flex flex-col justify-between min-h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-bold text-foreground">Recent Activity</h3>
            <button
              onClick={() => navigate("/transactions")}
              className="text-primary font-medium text-[14px] hover:underline cursor-pointer"
            >
              View All History
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-2">
            {recentTransactionsList.map((tx: any) => {
              const isIncome = tx.type === "INCOME";
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate("/transactions")}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105",
                      isIncome ? "bg-primary/10 text-primary" : "bg-muted text-secondary"
                    )}>
                      {isIncome ? <TrendingUp className="size-5" /> : <Receipt className="size-5" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[16px] font-bold text-foreground leading-snug">{tx.note}</p>
                      <p className="text-[12px] text-secondary mt-0.5">{tx.categoryName} • {tx.timeStr}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[16px] font-bold leading-snug",
                      isIncome ? "text-primary" : "text-[#a43a3a]"
                    )}>
                      {isIncome ? "+" : "-"}{formatMoney(tx.amount)}
                    </p>
                    <p className="text-[12px] text-secondary mt-0.5">{tx.accountName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Goal Emerald Gradient Card */}
        <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-[#059669] to-[#10b981] text-white p-6 rounded-xl flex flex-col justify-between shadow-sm min-h-[420px]">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[20px] font-bold">Savings Goal</h3>
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors outline-none cursor-pointer flex items-center justify-center">
              <Edit className="size-4 text-white" />
            </button>
          </div>

          <div className="mb-6 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="size-5" />
              <p className="text-[18px] font-bold">Financial Freedom Fund</p>
            </div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-[32px] leading-tight font-bold">
                {formatMoney(savingsProgress)} <span className="text-white/60 text-lg font-normal">/ {formatMoney(targetGoal)}</span>
              </p>
              <p className="text-[14px] font-semibold bg-white/20 px-2.5 py-0.5 rounded-full">{goalProgressPct}%</p>
            </div>
            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
              <div className="bg-white h-full transition-all duration-500" style={{ width: `${goalProgressPct}%` }}></div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-left font-sans">
            <p className="text-[12px] font-bold uppercase tracking-widest text-white/70 mb-1">Smart Suggestion</p>
            <p className="text-[14px] leading-relaxed">
              Based on your current savings pace, you've achieved <span className="font-bold">{goalProgressPct}%</span> of your emergency savings target. Log consistent income to accelerate growth.
            </p>
          </div>

          <button className="w-full mt-6 bg-white text-[#006c49] py-2.5 rounded-lg font-bold hover:bg-white/95 transition-colors active:scale-95 duration-100 cursor-pointer">
            Increase Monthly Contribution
          </button>
        </div>
      </div>

      {/* FAB contextual add transaction removed */}

      <CustomDialog
        isOpen={isTxDialogOpen}
        onClose={() => setIsTxDialogOpen(false)}
        title="Add Transaction"
        description="Fill out the fields to log a payment or income deposit."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsTxDialogOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={() => {
              if (!txDesc || !txAmount) {
                toast.error("Please fill in Description and Amount.")
                return
              }
              if (!txAccountId || !txCategoryId) {
                toast.error("Please select an Account and Category. Create them first if none exist.")
                return
              }
              txMutation.mutate({
                note: txDesc,
                amount: Number(txAmount),
                type: txType,
                transactionDate: new Date().toISOString(),
                accountId: txAccountId,
                categoryId: txCategoryId,
              })
            }} isLoading={txMutation.isPending}>
              Create Transaction
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 text-xs">
          <CustomInput
            label="Description"
            placeholder="e.g. Starbucks Espresso"
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
          />
          <CurrencyInput
            label="Amount"
            placeholder="0.00"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
          />
          <div className="flex flex-col gap-2 text-foreground">
            <span className="text-sm font-medium text-foreground select-none">Transaction Type</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTxTypeChange("EXPENSE")}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm border font-medium select-none transition-colors",
                  txType === "EXPENSE"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTxTypeChange("INCOME")}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm border font-medium select-none transition-colors",
                  txType === "INCOME"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Income
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-foreground">
            <CustomSelect
              label="Bank Account"
              placeholder="Select Account"
              value={txAccountId}
              onChange={setTxAccountId}
              options={accounts.filter(a => !a.isArchived).map((a) => ({ value: a.id, label: a.name }))}
            />

            <CustomSelect
              label="Category"
              placeholder="Select Category"
              value={txCategoryId}
              onChange={setTxCategoryId}
              isSearchable={true}
              options={categories.filter(c => c.type === txType).map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        </div>
      </CustomDialog>

      <CustomDialog
        isOpen={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
        title="Add Account"
        description="Register a new credit card, cash wallet, or bank account."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsAccountDialogOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={() => {
              if (!accName || !accBalance) {
                toast.error("Please fill in Account Name and Balance.")
                return
              }
              accMutation.mutate({
                name: accName,
                type: "CASH",
                openingBalance: Number(accBalance),
              })
            }} isLoading={accMutation.isPending}>
              Create Account
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <CustomInput
            label="Account Name"
            placeholder="e.g. Chase Checkings"
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
          />
          <CurrencyInput
            label="Initial Balance"
            placeholder="0.00"
            value={accBalance}
            onChange={(e) => setAccBalance(e.target.value)}
          />
        </div>
      </CustomDialog>

      <CustomDialog
        isOpen={isDebtDialogOpen}
        onClose={() => setIsDebtDialogOpen(false)}
        title="Record Debt Entry"
        description="Log an outstanding borrow or lent amount."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsDebtDialogOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={() => {
              if (!debtParty || !debtAmount) {
                toast.error("Please fill in Person Name and Amount.")
                return
              }
              if (!debtAccountId) {
                toast.error("Please select a bank account to link. Create one first if none exist.")
                return
              }
              debtMutation.mutate({
                partyName: debtParty,
                totalAmount: Number(debtAmount),
                type: debtType,
                debtDate: new Date().toISOString(),
                accountId: debtAccountId,
              })
            }} isLoading={debtMutation.isPending}>
              Record Debt
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 text-xs">
          <CustomInput
            label="Person/Party Name"
            placeholder="e.g. Jane Doe"
            value={debtParty}
            onChange={(e) => setDebtParty(e.target.value)}
          />
          <CurrencyInput
            label="Debt Amount"
            placeholder="0.00"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
          />
          <CustomSelect
            label="Link Bank Account"
            placeholder="Select Account"
            value={debtAccountId}
            onChange={setDebtAccountId}
            options={accounts.filter(a => !a.isArchived).map((a) => ({ value: a.id, label: a.name }))}
          />

          <div className="flex flex-col gap-2 text-foreground">
            <span className="text-sm font-medium text-foreground select-none">Debt Type</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDebtType("LENT")}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm border font-medium select-none transition-colors",
                  debtType === "LENT"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Lent (They owe me)
              </button>
              <button
                type="button"
                onClick={() => setDebtType("BORROW")}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm border font-medium select-none transition-colors",
                  debtType === "BORROW"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Borrow (I owe them)
              </button>
            </div>
          </div>
        </div>
      </CustomDialog>
    </div>
  )

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-12 animate-pulse">
      <div className="flex justify-between items-center border-b border-gray-100 pb-6">
        <div className="flex flex-col gap-2 w-1/3">
          <div className="h-7 w-2/3 bg-gray-200 rounded-[6px]" />
          <div className="h-4 w-1/2 bg-gray-200 rounded-[6px]" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-[10px]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-4">
            <div className="h-4 w-1/3 bg-gray-200 rounded-[6px]" />
            <div className="h-8 w-2/3 bg-gray-200 rounded-[6px]" />
          </div>
        ))}
      </div>

      <div className="h-24 bg-background-secondary border border-border rounded-[16px] p-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[300px] bg-card border border-border rounded-[16px] p-6" />
        <div className="h-[300px] bg-card border border-border rounded-[16px] p-6" />
      </div>
    </div>
  )
}
