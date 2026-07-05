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
  Calendar,
  Wallet,
  Users,
  PieChart as PieIcon,
  BarChart4,
} from "lucide-react"
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts"
import { toast } from "sonner"

import { api } from "../lib/api"
import { useAuthStore } from "../store/authStore"
import { CustomButton } from "../components/buttons/CustomButton"
import { Badge } from "../components/feedback/FeedbackStates"
import { CustomDialog } from "../components/dialogs/CustomDialog"
import { CustomInput, CurrencyInput } from "../components/inputs/CustomInput"

// Types matching backend dashboard service returns
interface DashboardData {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  pendingLent: number
  pendingBorrow: number
  recentTransactions: any[]
  recentDebts: any[]
  monthlySummary: any[]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const [period, setPeriod] = useState<"MONTH" | "WEEK" | "YEAR">("MONTH")
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false)

  // Fetch aggregate dashboard data directly (Section 58, 68, 69)
  const { data, isLoading, isError, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      const response = await api.get(`/dashboard`, {
        params: { period },
      })
      return response.data.data
    },
  })

  // Quick Action form submissions (Section 61)
  const [txDesc, setTxDesc] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  
  const [accName, setAccName] = useState("")
  const [accBalance, setAccBalance] = useState("")

  const [debtParty, setDebtParty] = useState("")
  const [debtAmount, setDebtAmount] = useState("")
  const [debtType, setDebtType] = useState<"LENT" | "BORROW">("LENT")

  const txMutation = useMutation({
    mutationFn: (newTx: any) => api.post("/transactions", newTx),
    onSuccess: () => {
      toast.success("Transaction added successfully!")
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setIsTxDialogOpen(false)
      // Reset form
      setTxDesc("")
      setTxAmount("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add transaction")
    }
  })

  const accMutation = useMutation({
    mutationFn: (newAcc: any) => api.post("/accounts", newAcc),
    onSuccess: () => {
      toast.success("Account created successfully!")
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

  const dashboardData = data || {
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    pendingLent: 0,
    pendingBorrow: 0,
    recentTransactions: [],
    recentDebts: [],
    monthlySummary: [],
  }

  // Summary Metrics Grid (Section 60)
  const summaries = [
    {
      id: "balance",
      title: "Total Balance",
      amount: dashboardData.totalBalance,
      icon: <DollarSign className="size-5 text-secondary" />,
      color: "text-gray-900",
      action: () => navigate("/accounts"),
    },
    {
      id: "income",
      title: "Income",
      amount: dashboardData.totalIncome,
      icon: <ArrowDownLeft className="size-5 text-success" />,
      color: "text-success",
      action: () => navigate("/transactions", { state: { filterType: "INCOME" } }),
    },
    {
      id: "expense",
      title: "Expenses",
      amount: dashboardData.totalExpense,
      icon: <ArrowUpRight className="size-5 text-danger" />,
      color: "text-gray-900",
      action: () => navigate("/transactions", { state: { filterType: "EXPENSE" } }),
    },
    {
      id: "debts",
      title: "Pending Debts",
      amount: dashboardData.pendingLent - dashboardData.pendingBorrow,
      icon: <Users className="size-5 text-warning" />,
      color: "text-gray-900",
      action: () => navigate("/debts"),
    },
  ]

  // Setup analytics chart series (Section 64)
  const compareData = [
    { name: "Income", amount: dashboardData.totalIncome, color: "#16A34A" },
    { name: "Expenses", amount: dashboardData.totalExpense, color: "#DC2626" },
  ]

  // Map category distributions for pie chart (dynamic mockup or actual counts)
  const pieData = [
    { name: "Food & Drinks", value: 35, color: "#706677" },
    { name: "Transport", value: 20, color: "#565264" },
    { name: "Bills & Utilities", value: 25, color: "#9ca3af" },
    { name: "Others", value: 20, color: "#e5e7eb" },
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Header (Section 59) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span> •{" "}
            {format(new Date(), "eeee, d MMMM yyyy")}
          </p>
        </div>
        <div>
          <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={() => setIsTxDialogOpen(true)}>
            <Plus className="size-4" />
            Add Transaction
          </CustomButton>
        </div>
      </div>

      {/* 2. Summary Cards (Section 60) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        {summaries.map((card) => (
          <div
            key={card.id}
            onClick={card.action}
            className="bg-white border border-gray-250 border-gray-200/80 rounded-[16px] p-6 shadow-card hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</span>
              <div className="p-2 rounded-full bg-gray-50 border border-gray-100">{card.icon}</div>
            </div>
            <span className={`text-3xl font-bold ${card.color}`}>
              ${Math.abs(card.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Quick Actions row (Section 61) */}
      <div className="bg-gray-50/50 p-6 rounded-[16px] border border-gray-200/80 flex flex-col gap-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CustomButton variant="primary" className="gap-2" onClick={() => setIsTxDialogOpen(true)}>
            <Plus className="size-4" />
            Add Transaction
          </CustomButton>
          <CustomButton variant="secondary" className="gap-2" onClick={() => setIsAccountDialogOpen(true)}>
            <Wallet className="size-4" />
            Add Account
          </CustomButton>
          <CustomButton variant="secondary" className="gap-2" onClick={() => setIsDebtDialogOpen(true)}>
            <Users className="size-4" />
            Add Debt
          </CustomButton>
        </div>
      </div>

      {/* 4. Analytics Visualisations (Section 64) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expenses Column */}
        <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <BarChart4 className="size-5 text-secondary" />
            <h3 className="text-base font-semibold text-gray-900">Cash Flow (Income vs Expenses)</h3>
          </div>
          <div className="h-[250px] w-full mt-2">
            {dashboardData.totalIncome === 0 && dashboardData.totalExpense === 0 ? (
              <div className="size-full flex flex-col items-center justify-center text-center text-gray-400 text-xs gap-1.5">
                <FolderOpen className="size-8" />
                <span>No cash flow records found in period.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {compareData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Pie Column */}
        <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <PieIcon className="size-5 text-secondary" />
            <h3 className="text-base font-semibold text-gray-900">Expense Allocations</h3>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center mt-2">
            {dashboardData.totalExpense === 0 ? (
              <div className="size-full flex flex-col items-center justify-center text-center text-gray-400 text-xs gap-1.5">
                <FolderOpen className="size-8" />
                <span>No expense records to analyze.</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full px-4">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-medium">{d.name} ({d.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Lists Grid (Section 62, 63) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Transactions Widget */}
        <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
            <button
              type="button"
              onClick={() => navigate("/transactions")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex-1">
            {dashboardData.recentTransactions.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-xs text-gray-400 gap-1.5">
                <FolderOpen className="size-8" />
                <span>No transactions recorded.</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {dashboardData.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">{tx.note || "Transaction"}</span>
                      <span className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(tx.transactionDate), "d MMM yyyy")}
                      </span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      tx.type === "INCOME" ? "text-success" : "text-gray-900"
                    )}>
                      {tx.type === "INCOME" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Debts Widget */}
        <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-semibold text-gray-900">Outstanding Debts</h3>
            <button
              type="button"
              onClick={() => navigate("/debts")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex-1">
            {dashboardData.recentDebts.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-xs text-gray-400 gap-1.5">
                <Users className="size-8" />
                <span>No outstanding debts.</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {dashboardData.recentDebts.slice(0, 5).map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">{debt.partyName}</span>
                      <span className="text-xs text-gray-400 mt-0.5">
                        Due: {format(new Date(debt.debtDate), "d MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm font-bold",
                        debt.type === "LENT" ? "text-success" : "text-danger"
                      )}>
                        {debt.type === "LENT" ? "Lent:" : "Borrow:"} ${Number(debt.totalAmount).toFixed(2)}
                      </span>
                      <Badge variant="warning">{debt.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Global Interactive Overlays */}
      
      {/* 1. Add Transaction Dialog (Section 59/61) */}
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
              txMutation.mutate({
                note: txDesc,
                amount: Number(txAmount),
                type: txType,
                transactionDate: new Date().toISOString().split("T")[0],
                accountId: "default", // will fall back to default backend account
                categoryId: "default",
              })
            }} isLoading={txMutation.isPending}>
              Create Transaction
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
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
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 select-none">Transaction Type</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTxType("EXPENSE")}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm border font-medium select-none transition-colors",
                  txType === "EXPENSE"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setTxType("INCOME")}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm border font-medium select-none transition-colors",
                  txType === "INCOME"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                Income
              </button>
            </div>
          </div>
        </div>
      </CustomDialog>

      {/* 2. Add Account Dialog (Section 61) */}
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
                balance: Number(accBalance),
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

      {/* 3. Add Debt Dialog (Section 61) */}
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
              debtMutation.mutate({
                partyName: debtParty,
                totalAmount: Number(debtAmount),
                type: debtType,
                debtDate: new Date().toISOString().split("T")[0],
                accountId: "default",
              })
            }} isLoading={debtMutation.isPending}>
              Record Debt
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
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
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 select-none">Debt Type</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDebtType("LENT")}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm border font-medium select-none transition-colors",
                  debtType === "LENT"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
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
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
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

// Compact Loading Skeleton representation (Section 65)
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
          <div key={i} className="bg-white border border-gray-100 rounded-[16px] p-6 shadow-card flex flex-col gap-4">
            <div className="h-4 w-1/3 bg-gray-200 rounded-[6px]" />
            <div className="h-8 w-2/3 bg-gray-200 rounded-[6px]" />
          </div>
        ))}
      </div>

      <div className="h-24 bg-gray-50 border border-gray-100 rounded-[16px] p-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[300px] bg-white border border-gray-100 rounded-[16px] p-6" />
        <div className="h-[300px] bg-white border border-gray-100 rounded-[16px] p-6" />
      </div>
    </div>
  )
}
