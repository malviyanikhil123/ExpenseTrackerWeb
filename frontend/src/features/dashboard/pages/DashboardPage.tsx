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

import { api } from "../../../lib/api"
import { useAuthStore } from "../../../store/authStore"
import { useAccountsList } from "../../accounts/hooks/useAccounts"
import { useCategoriesList } from "../../categories/hooks/useCategories"
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

  const { data: accounts = [] } = useAccountsList()
  const { data: categories = [] } = useCategoriesList()

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
  }

  const summaries = [
    {
      id: "balance",
      title: "Total Balance",
      amount: dashboardData.totalBalance,
      icon: <DollarSign className="size-5 text-secondary" />,
      color: "text-foreground",
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
      icon: <ArrowUpRight className="size-5 text-primary" />,
      color: "text-primary",
      action: () => navigate("/transactions", { state: { filterType: "EXPENSE" } }),
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

  const compareData = [
    { name: "Income", amount: dashboardData.totalIncome, color: "var(--chart-income)" },
    { name: "Expenses", amount: dashboardData.totalExpense, color: "var(--chart-expenses)" },
  ]

  const pieData = [
    { name: "Food & Drinks", value: 35, color: "var(--chart-expenses)" },
    { name: "Transport", value: 20, color: "var(--chart-income)" },
    { name: "Bills & Utilities", value: 25, color: "var(--chart-savings)" },
    { name: "Others", value: 20, color: "var(--chart-transfers)" },
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[32px] font-bold leading-[40px] text-foreground">Dashboard</h1>
          <p className="text-[14px] font-normal text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span> •{" "}
            {format(new Date(), "eeee, d MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        {summaries.map((card) => (
          <div
            key={card.id}
            onClick={card.action}
            className="bg-card border border-border rounded-[16px] p-6 shadow-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer flex flex-col gap-4 text-card-foreground"
          >
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{card.title}</span>
              <div className="p-2 rounded-full bg-muted border border-border">{card.icon}</div>
            </div>
            <span className={`text-[40px] font-extrabold leading-none tracking-tight ${card.color}`}>
              {formatMoney(Math.abs(card.amount))}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-card/50 p-6 rounded-[16px] border border-border flex flex-col gap-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CustomButton variant="primary" className="w-full gap-2" onClick={handleOpenTx}>
            <Plus className="size-4" />
            Add Transaction
          </CustomButton>
          <CustomButton variant="secondary" className="w-full gap-2" onClick={() => setIsAccountDialogOpen(true)}>
            <Wallet className="size-4" />
            Add Account
          </CustomButton>
          <CustomButton variant="secondary" className="w-full gap-2" onClick={handleOpenDebt}>
            <Users className="size-4" />
            Add Debt
          </CustomButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-4 text-card-foreground">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BarChart4 className="size-5 text-secondary" />
            <h3 className="text-base font-semibold text-foreground">Cash Flow (Income vs Expenses)</h3>
          </div>
          <div className="h-[250px] w-full mt-2">
            {dashboardData.totalIncome === 0 && dashboardData.totalExpense === 0 ? (
              <div className="size-full flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-1.5">
                <FolderOpen className="size-8" />
                <span>No cash flow records found in period.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="#5C4E43" fontSize={12} fontWeight={600} tickLine={false} />
                  <YAxis stroke="#5C4E43" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
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

        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-4 text-card-foreground">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <PieIcon className="size-5 text-secondary" />
            <h3 className="text-base font-semibold text-foreground">Expense Allocations</h3>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center mt-2">
            {dashboardData.totalExpense === 0 ? (
              <div className="size-full flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-1.5">
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
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col justify-between gap-4 text-card-foreground">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-semibold text-foreground">Recent Transactions</h3>
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
              <div className="h-40 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-1.5">
                <FolderOpen className="size-8" />
                <span>No transactions recorded.</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {dashboardData.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{tx.note || "Transaction"}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(tx.transactionDate), "d MMM yyyy")}
                      </span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      tx.type === "INCOME" ? "text-success" : "text-primary"
                    )}>
                      {tx.type === "INCOME" ? "+" : "-"}{formatMoney(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col justify-between gap-4 text-card-foreground">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-semibold text-foreground">Outstanding Debts</h3>
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
              <div className="h-40 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-1.5">
                <Users className="size-8" />
                <span>No outstanding debts.</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {dashboardData.recentDebts.slice(0, 5).map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{debt.partyName}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Due: {format(new Date(debt.debtDate), "d MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm font-bold",
                        debt.type === "LENT" ? "text-success" : "text-danger"
                      )}>
                        {debt.type === "LENT" ? "Lent: " : "Borrow: "}{formatMoney(debt.totalAmount)}
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
