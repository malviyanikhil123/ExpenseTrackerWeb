import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { format } from "date-fns"
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  X,
  AlertCircle,
  FolderOpen,
  Info,
  TrendingUp,
  TrendingDown,
  Receipt,
  Coins,
  CreditCard,
  Sparkles,
  Award
} from "lucide-react"
import { toast } from "sonner"

import {
  useTransactionsList,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../hooks/useTransactions"
import { useCategoriesList, useCategoryIcons } from "../../categories/hooks/useCategories"
import * as Icons from "lucide-react"
import { useAccountsList } from "../../accounts/hooks/useAccounts"
import { usePaymentMethodsList } from "../../payment-methods/hooks/usePaymentMethods"

import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput, CurrencyInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { useCurrency } from "../../../hooks/useCurrency"
import { Badge } from "../../../components/feedback/FeedbackStates"
import { CustomPagination } from "../../../components/pagination/CustomPagination"
import { CustomSelect } from "../../../components/inputs/CustomSelect"
import { CustomDatePicker } from "../../../components/inputs/CustomDatePicker"

export default function TransactionsPage() {
  const location = useLocation()
  const { format: formatMoney } = useCurrency()
  const initialTypeFilter = location.state?.filterType || undefined

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"INCOME" | "EXPENSE" | undefined>(initialTypeFilter)
  const [filterAccountId, setFilterAccountId] = useState<string>("")
  const [filterCategoryId, setFilterCategoryId] = useState<string>("")
  const [filterPaymentMethodId, setFilterPaymentMethodId] = useState<string>("")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [isInsightVisible, setIsInsightVisible] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedTx, setSelectedTx] = useState<any>(null)
  
  // Form attributes
  const [txDesc, setTxDesc] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">("EXPENSE")
  const [txPaymentMethodId, setTxPaymentMethodId] = useState("")
  const [txAccountId, setTxAccountId] = useState("")
  const [txCategoryId, setTxCategoryId] = useState("")
  const [txDestinationAccountId, setTxDestinationAccountId] = useState("")
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0])

  // Pagination page state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Dropdown list hooks
  const { data: categories = [] } = useCategoriesList()
  const { data: accounts = [] } = useAccountsList()
  const { data: icons = [] } = useCategoryIcons()
  const { data: paymentMethods = [] } = usePaymentMethodsList()

  const renderCategoryIcon = (iconName: string, color?: string) => {
    const IconComp = (Icons as any)[iconName]
    if (!IconComp) return <Icons.FolderOpen className="size-4" style={{ color }} />
    return <IconComp className="size-4" style={{ color }} />
  }

  const getFilteredAccounts = (pmCode: string) => {
    if (pmCode === "CASH") {
      return accounts.filter((a) => a.type === "CASH" && !a.isArchived)
    }
    if (
      pmCode === "GOOGLE_PAY" ||
      pmCode === "PHONEPE" ||
      pmCode === "BHIM" ||
      pmCode === "NET_BANKING" ||
      pmCode === "DEBIT_CARD"
    ) {
      return accounts.filter((a) => a.type === "BANK" && !a.isArchived)
    }
    if (pmCode === "CREDIT_CARD") {
      return accounts.filter((a) => a.type === "CREDIT_CARD" && !a.isArchived)
    }
    if (pmCode === "PAYTM") {
      return accounts.filter((a) => a.type === "E_WALLET" && !a.isArchived)
    }
    return accounts.filter((a) => !a.isArchived)
  }

  // Dynamic Account Auto-Selection Effect
  useEffect(() => {
    if (!txPaymentMethodId) return
    const selectedPm = paymentMethods.find((p) => p.id === txPaymentMethodId)
    if (!selectedPm) return
    const filtered = getFilteredAccounts(selectedPm.code)
    const isValid = filtered.some((a) => a.id === txAccountId)
    if (!isValid && filtered.length > 0) {
      setTxAccountId(filtered[0].id)
    }
  }, [txPaymentMethodId, paymentMethods, accounts])
  
  const queryFilters = {
    type: filterType,
    accountId: filterAccountId || undefined,
    categoryId: filterCategoryId || undefined,
    paymentMethodId: filterPaymentMethodId || undefined,
    startDate: filterStartDate ? new Date(filterStartDate).toISOString() : undefined,
    endDate: filterEndDate ? new Date(filterEndDate).toISOString() : undefined,
  }

  const { data: transactions = [], isLoading, isError, refetch } = useTransactionsList(queryFilters)

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = (tx.note || "Transaction").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || tx.type === filterType
    const matchesAccount = !filterAccountId || tx.accountId === filterAccountId || tx.destinationAccountId === filterAccountId
    const matchesCategory = !filterCategoryId || tx.categoryId === filterCategoryId
    const matchesPaymentMethod = !filterPaymentMethodId || tx.paymentMethodId === filterPaymentMethodId
    const matchesStartDate = !filterStartDate || new Date(tx.transactionDate) >= new Date(filterStartDate)
    const matchesEndDate = !filterEndDate || new Date(tx.transactionDate) <= new Date(filterEndDate + "T23:59:59")
    return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesPaymentMethod && matchesStartDate && matchesEndDate
  })

  // Pagination calculation
  const totalItems = filteredTransactions.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleTxTypeChange = (type: "INCOME" | "EXPENSE" | "TRANSFER") => {
    setTxType(type)
    if (type === "TRANSFER") {
      setTxCategoryId("")
    } else {
      const matchedCats = categories.filter((c) => c.type === type)
      setTxCategoryId(matchedCats[0]?.id || categories[0]?.id || "")
    }
  }

  const handleOpenCreate = () => {
    setTxDesc("")
    setTxAmount("")
    setTxType("EXPENSE")
    const defaultPm = paymentMethods.find((pm) => pm.code === "CASH") || paymentMethods[0]
    setTxPaymentMethodId(defaultPm?.id || "")
    const filteredAccs = defaultPm ? getFilteredAccounts(defaultPm.code) : accounts
    setTxAccountId(filteredAccs.find((a) => a.isDefault)?.id || filteredAccs[0]?.id || "")
    setTxCategoryId(categories.filter((c) => c.type === "EXPENSE")[0]?.id || categories[0]?.id || "")
    setTxDestinationAccountId("")
    setTxDate(new Date().toISOString().split("T")[0])
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (tx: any) => {
    setSelectedTx(tx)
    setTxDesc(tx.note || "")
    setTxAmount(String(tx.amount))
    setTxType(tx.type)
    setTxPaymentMethodId(tx.paymentMethodId)
    setTxAccountId(tx.accountId)
    setTxCategoryId(tx.categoryId || "")
    setTxDestinationAccountId(tx.destinationAccountId || "")
    setTxDate(new Date(tx.transactionDate).toISOString().split("T")[0])
    setIsEditOpen(true)
  }

  const handleOpenDelete = (tx: any) => {
    setSelectedTx(tx)
    setIsDeleteOpen(true)
  }

  const handleCreate = () => {
    if (!txAmount || Number(txAmount) <= 0) {
      toast.error("Please enter a valid amount greater than 0.")
      return
    }
    if (!txPaymentMethodId) {
      toast.error("Please select a Payment Method.")
      return
    }
    if (!txAccountId) {
      toast.error("Please select an Account.")
      return
    }
    if (txType !== "TRANSFER" && !txCategoryId) {
      toast.error("Please select a Category.")
      return
    }
    if (txType === "TRANSFER" && !txDestinationAccountId) {
      toast.error("Please select a Destination Account.")
      return
    }

    createMutation.mutate(
      {
        note: txDesc.trim() || undefined,
        amount: Number(txAmount),
        type: txType,
        paymentMethodId: txPaymentMethodId,
        accountId: txAccountId,
        categoryId: txType !== "TRANSFER" ? txCategoryId : undefined,
        destinationAccountId: txType === "TRANSFER" ? txDestinationAccountId : undefined,
        transactionDate: new Date(txDate).toISOString(),
      },
      {
        onSuccess: () => setIsCreateOpen(false),
      }
    )
  }

  const handleEdit = () => {
    if (!txAmount || Number(txAmount) <= 0) {
      toast.error("Please enter a valid amount.")
      return
    }
    if (!txPaymentMethodId) {
      toast.error("Please select a Payment Method.")
      return
    }
    if (txType !== "TRANSFER" && !txCategoryId) {
      toast.error("Please select a Category.")
      return
    }
    if (txType === "TRANSFER" && !txDestinationAccountId) {
      toast.error("Please select a Destination Account.")
      return
    }

    updateMutation.mutate(
      {
        id: selectedTx.id,
        data: {
          note: txDesc.trim() || undefined,
          amount: Number(txAmount),
          type: txType,
          paymentMethodId: txPaymentMethodId,
          accountId: txAccountId,
          categoryId: txType !== "TRANSFER" ? txCategoryId : null,
          destinationAccountId: txType === "TRANSFER" ? txDestinationAccountId : null,
          transactionDate: new Date(txDate).toISOString(),
        },
      },
      {
        onSuccess: () => setIsEditOpen(false),
      }
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(selectedTx.id, {
      onSuccess: () => setIsDeleteOpen(false),
    })
  }

  const getAccountName = (id: string) => {
    return accounts.find((a) => a.id === id)?.name || "Unknown Account"
  }

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || "Unknown Category"
  }

  const clearFilters = () => {
    setFilterType(undefined)
    setFilterAccountId("")
    setFilterCategoryId("")
    setFilterStartDate("")
    setFilterEndDate("")
    setIsFilterPanelOpen(false)
  }

  if (isLoading) {
    return <TransactionsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-danger/10 bg-danger/5 rounded-[16px] max-w-2xl mx-auto mt-12">
        <AlertCircle className="size-12 text-danger mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-1">Failed to fetch transactions</h2>
        <p className="text-sm text-muted-foreground mb-6">There was an error communicating with the database.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry
        </CustomButton>
      </div>
    )
  }

  const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
  const netChange = totalIncome - totalExpense;

  const pageTotal = paginatedTransactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount)), 0);

  const totalSavings = accounts.filter(a => a.type !== 'CREDIT_CARD').reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  const savingsTarget = totalSavings <= 0 ? 50000 : totalSavings < 15000 ? 15000 : totalSavings < 50000 ? 50000 : totalSavings < 100000 ? 100000 : Math.ceil(totalSavings / 50000) * 50000;
  const goalProgressPct = Math.min(100, Math.round((totalSavings / savingsTarget) * 100));
  const expenseBudget = 50000;
  const expensePercent = expenseBudget > 0 ? Math.min(100, Math.round((totalExpense / expenseBudget) * 100)) : 0;

  // Find category with highest expense
  const getHighestExpenseCategory = () => {
    const expenseTxs = filteredTransactions.filter(t => t.type === 'EXPENSE');
    if (expenseTxs.length === 0) return { name: "Dining & Entertainment", amount: 0 };
    const catTotals: Record<string, number> = {};
    expenseTxs.forEach(t => {
      const cName = t.category?.name || "Other Expenses";
      catTotals[cName] = (catTotals[cName] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    return { name: sorted[0][0], amount: sorted[0][1] };
  };
  const highestExpenseCat = getHighestExpenseCategory();

  // Calculate dynamic wellness score
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const wellnessScore = totalIncome > 0 ? Math.min(99, Math.max(50, Math.round(50 + (savingsRate / 2)))) : 75;

  return (
    <div className="flex flex-col gap-8 pb-12 select-none font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5 text-left font-sans">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-[40px] text-foreground">Transactions</h1>
          <p className="text-[14px] text-secondary">Record payments, manage expenses, and view cash flow receipts.</p>
        </div>
        <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Transaction
        </CustomButton>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none font-sans">
        {/* Net Change Card */}
        <div className="bg-card border border-border shadow-sm p-6 rounded-2xl flex flex-col justify-between text-left font-sans">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Net Change</p>
              <h2 className={cn("text-[24px] font-bold mt-1 font-sans", netChange >= 0 ? "text-primary" : "text-[#a43a3a]")}>
                {netChange >= 0 ? "+" : ""}{formatMoney(netChange)}
              </h2>
            </div>
            <span className="p-2 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="size-5 text-primary" />
            </span>
          </div>
          <div className="flex items-center gap-1 font-sans">
            <span className="text-primary font-bold text-[12px]">+12%</span>
            <span className="text-secondary text-[12px]">vs last month</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-card border border-border shadow-sm p-6 rounded-2xl flex flex-col justify-between text-left font-sans">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Total Expenses</p>
              <h2 className="text-[24px] font-bold text-[#a43a3a] mt-1 font-sans">-{formatMoney(totalExpense)}</h2>
            </div>
            <span className="p-2 bg-[#a43a3a]/10 rounded-xl flex items-center justify-center">
              <Receipt className="size-5 text-[#a43a3a]" />
            </span>
          </div>
          <div className="w-full bg-[#eff4ff] h-2 rounded-full mt-2 font-sans">
            <div className="bg-[#a43a3a] h-full rounded-full transition-all" style={{ width: `${expensePercent}%` }}></div>
          </div>
          <p className="text-[12px] text-secondary mt-1 font-sans">{expensePercent}% of monthly budget used</p>
        </div>

        {/* Savings Growth Card */}
        <div className="bg-card border border-border shadow-sm p-6 rounded-2xl flex flex-col justify-between text-left font-sans">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Savings Growth</p>
              <h2 className="text-[24px] font-bold text-foreground mt-1 font-sans">
                {formatMoney(totalSavings)}
              </h2>
            </div>
            <span className="p-2 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingDown className="size-5 text-primary" style={{ transform: "rotate(180deg)" }} />
            </span>
          </div>
          <p className="text-[12px] text-secondary mt-1 font-sans">On track: {goalProgressPct}% of target savings achieved</p>
        </div>
      </div>

      {/* Filters Section (Inline) */}
      <div className="bg-card border border-border shadow-sm rounded-xl p-6 select-none">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search Box */}
          <div className="flex-1 min-w-[200px] text-left">
            <label className="block text-[12px] font-bold text-secondary mb-1">Search Description</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-60 size-4" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* Flow Type Filter */}
          <div className="flex-1 min-w-[150px] text-left">
            <CustomSelect
              label="Flow Type"
              value={filterType || ""}
              onChange={(val) => {
                setFilterType(val ? val as any : undefined)
                setCurrentPage(1)
              }}
              options={[
                { value: "", label: "All Flow Types" },
                { value: "INCOME", label: "Income Deposits" },
                { value: "EXPENSE", label: "Expense Purchases" }
              ]}
            />
          </div>

          {/* Account Filter */}
          <div className="flex-1 min-w-[180px] text-left">
            <CustomSelect
              label="Account"
              value={filterAccountId}
              onChange={(val) => {
                setFilterAccountId(val)
                setCurrentPage(1)
              }}
              options={[
                { value: "", label: "All Accounts" },
                ...accounts.map(a => ({ value: a.id, label: a.name }))
              ]}
            />
          </div>

          {/* Category Filter */}
          <div className="flex-1 min-w-[180px] text-left">
            <CustomSelect
              label="Category"
              value={filterCategoryId}
              onChange={(val) => {
                setFilterCategoryId(val)
                setCurrentPage(1)
              }}
              options={[
                { value: "", label: "All Categories" },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>

          {/* Payment Method Filter */}
          <div className="flex-1 min-w-[150px] text-left">
            <CustomSelect
              label="Method"
              value={filterPaymentMethodId}
              onChange={(val) => {
                setFilterPaymentMethodId(val)
                setCurrentPage(1)
              }}
              options={[
                { value: "", label: "Any Method" },
                ...paymentMethods.map(pm => ({ value: pm.id, label: pm.name }))
              ]}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-border text-secondary hover:bg-muted/50 rounded-lg text-[14px] font-bold transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-card-foreground select-none">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
          <h3 className="text-[20px] font-bold text-foreground">Transaction Ledger</h3>
          <div className="flex gap-2">
            <button className="p-2 text-secondary hover:bg-muted rounded-lg transition-colors border border-border cursor-pointer flex items-center justify-center outline-none bg-card">
              <Icons.Download className="size-4" />
            </button>
            <button className="p-2 text-secondary hover:bg-muted rounded-lg transition-colors border border-border cursor-pointer flex items-center justify-center outline-none bg-card">
              <Icons.Printer className="size-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar text-left">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-secondary font-semibold uppercase tracking-wider select-none text-[11px]">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Method</th>
                <th className="py-4 px-6">Account</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginatedTransactions.map((tx) => {
                const isIncome = tx.type === "INCOME";
                const isTransfer = tx.type === "TRANSFER";
                const amountVal = Number(tx.amount);
                const formattedAmount = `${isIncome ? "+" : "-"}${formatMoney(amountVal)}`;
                const note = tx.note || "Transaction";
                const dateStr = format(new Date(tx.transactionDate), "MMM d, yyyy");
                const catName = isTransfer ? `Transfer → ${getAccountName(tx.destinationAccountId || "")}` : getCategoryName(tx.categoryId || "");
                const methodCode = tx.paymentMethod?.code || "CASH";
                
                const renderRowIcon = () => {
                  if (isIncome) {
                    return <Icons.TrendingUp className="size-5 text-primary" />;
                  }
                  if (methodCode === "CREDIT_CARD") {
                    return <Icons.CreditCard className="size-5 text-[#a43a3a]" />;
                  }
                  if (methodCode === "CASH") {
                    return <Icons.Coins className="size-5 text-secondary" />;
                  }
                  return <Icons.Receipt className="size-5 text-primary" />;
                };

                return (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-4 px-6 font-medium text-secondary">{dateStr}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isIncome ? "bg-primary/10 text-primary" : "bg-muted text-secondary"
                        )}>
                          {renderRowIcon()}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] text-foreground leading-snug">
                            {isTransfer ? `Transfer → ${getAccountName(tx.destinationAccountId || "")}` : catName || tx.type}
                          </p>
                          <p className="text-[12px] text-secondary mt-0.5">
                            {isIncome ? "Income" : isTransfer ? "Transfer" : "Expense"}
                          </p>
                          {tx.note && (
                            <p className={cn(
                              "text-[12px] leading-tight mt-1 flex items-center gap-1 max-w-[220px] truncate",
                              isIncome ? "text-primary/80" : "text-[#a43a3a]/80"
                            )}>
                              <Icons.FileText className="size-3 flex-shrink-0" />
                              {tx.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-3 py-1 font-semibold text-[12px] rounded-full",
                        isIncome ? "bg-primary/10 text-primary" : "bg-[#10b981]/10 text-[#10b981]"
                      )}>
                        {isTransfer ? "Transfer" : catName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-secondary text-[13px]">
                      <div className="flex items-center gap-1.5">
                        <Icons.CreditCard className="size-3.5" />
                        <span>{tx.paymentMethod?.name || "Cash"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-secondary text-[13px]">{getAccountName(tx.accountId)}</td>
                    <td className={cn(
                      "py-4 px-6 font-bold text-[15px] text-right",
                      isIncome ? "text-primary" : "text-[#a43a3a]"
                    )}>
                      {formattedAmount}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer outline-none flex items-center justify-center"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(tx)}
                          className="p-1.5 text-secondary hover:text-[#a43a3a] hover:bg-[#a43a3a]/10 rounded-full transition-colors cursor-pointer outline-none flex items-center justify-center"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Bar at Bottom of Table */}
        <div className="bg-muted/20 p-6 border-t border-border/30 select-none text-left">
          <div className="flex flex-wrap justify-between items-center gap-6">
            <div className="flex gap-8">
              <div>
                <p className="text-[12px] font-bold text-secondary uppercase tracking-widest mb-1">Page Total</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-[20px] font-bold", pageTotal >= 0 ? "text-primary" : "text-[#a43a3a]")}>
                    {pageTotal >= 0 ? "+" : ""}{formatMoney(pageTotal)}
                  </span>
                  <span className="text-[12px] text-secondary font-medium">({paginatedTransactions.length} Transactions)</span>
                </div>
              </div>
              <div className="hidden sm:block border-l border-border/30 pl-8 text-left">
                <p className="text-[12px] font-bold text-secondary uppercase tracking-widest mb-1">Selection Total</p>
                <p className="text-[20px] font-bold text-foreground">₹0.00</p>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-4">
              <span className="text-[14px] text-secondary font-medium">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-all text-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Icons.ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-lg font-bold transition-all text-[13px] cursor-pointer",
                        currentPage === pNum
                          ? "bg-primary text-white shadow-sm"
                          : "border border-border/60 bg-card hover:bg-muted text-secondary"
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-all text-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Icons.ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Insights Panel */}
      {isInsightVisible && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none mt-6">
          <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden text-left font-sans">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Icons.Sparkles className="size-20" />
            </div>
            <h4 className="text-[20px] font-bold text-primary mb-2">AI Spending Insight</h4>
            <p className="text-[14px] text-secondary leading-relaxed max-w-3xl">
              {highestExpenseCat.amount > 0 ? (
                <>
                  We've noticed that your highest spending category is <span className="font-bold text-foreground">{highestExpenseCat.name}</span> with a total of <span className="font-bold text-foreground">{formatMoney(highestExpenseCat.amount)}</span>. To accelerate your savings progress, we recommend tracking this category closely.
                </>
              ) : (
                <>
                  No recent expense transactions found. Log some purchases to get personalized AI budget recommendations.
                </>
              )}
            </p>
            <div className="mt-4 flex gap-4">
              <button className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[14px] font-bold hover:bg-primary/20 transition-all cursor-pointer">
                Review Budget
              </button>
              <button
                onClick={() => setIsInsightVisible(false)}
                className="text-secondary font-bold text-[14px] hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="bg-primary text-white rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm font-sans">
            <Icons.Award className="size-12 mb-3 text-white" />
            <p className="text-[12px] font-bold uppercase tracking-wider opacity-85 mb-1">Wellness Score</p>
            <h3 className="text-[48px] font-bold leading-none">{wellnessScore}</h3>
            <p className="text-[13px] mt-2 opacity-90 px-4">
              {wellnessScore >= 85
                ? `You're in the top ${wellnessScore - 80}% of savers. Excellent consistency!`
                : "Log income transactions and manage expenses to optimize your financial wellness score."}
            </p>
          </div>
        </div>
      )}

      {/* Add Transaction Dialog */}
      <CustomDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Transaction"
        description="Insert descriptive ledger entries to audit finances."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleCreate} isLoading={createMutation.isPending}>
              Create Transaction
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 font-sans text-xs">
          
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-muted-foreground select-none">Transaction Flow</span>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTxTypeChange("EXPENSE")}
                className={cn(
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
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
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
                  txType === "INCOME"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => handleTxTypeChange("TRANSFER")}
                className={cn(
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
                  txType === "TRANSFER"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Transfer
              </button>
            </div>
          </div>

          <CurrencyInput
            label="Transaction Amount"
            placeholder="0.00"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3 text-foreground">
            <CustomSelect
              label="Payment Method"
              value={txPaymentMethodId}
              onChange={setTxPaymentMethodId}
              options={paymentMethods.map((pm) => ({ value: pm.id, label: pm.name }))}
            />

            <CustomSelect
              label={txType === "TRANSFER" ? "Source Account" : "Bank Account"}
              value={txAccountId}
              onChange={setTxAccountId}
              options={(() => {
                const pm = paymentMethods.find((p) => p.id === txPaymentMethodId)
                const list = pm ? getFilteredAccounts(pm.code) : accounts.filter((a) => !a.isArchived)
                return list.map((a) => ({ value: a.id, label: a.name }))
              })()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-foreground">
            {txType === "TRANSFER" ? (
              <CustomSelect
                label="Destination Account"
                value={txDestinationAccountId}
                onChange={setTxDestinationAccountId}
                options={accounts
                  .filter(a => !a.isArchived && a.id !== txAccountId && a.type !== "DEBIT_CARD" && a.type !== "UPI")
                  .map((a) => ({ value: a.id, label: a.name }))}
              />
            ) : (
              <CustomSelect
                label="Category type"
                value={txCategoryId}
                onChange={setTxCategoryId}
                isSearchable={true}
                options={categories.filter(c => c.type === txType).map((c) => {
                  const iconObj = icons.find((i) => i.id === c.categoryIconId)
                  const iconKey = iconObj?.iconKey || "FolderOpen"
                  return {
                    value: c.id,
                    label: c.name,
                    icon: renderCategoryIcon(iconKey, c.color || "#64748b")
                  }
                })}
              />
            )}

            <CustomDatePicker
              label="Transaction Date"
              value={txDate}
              onChange={setTxDate}
            />
          </div>

          <CustomInput
            label="Description Note (Optional)"
            placeholder="e.g. Weekly organic food basket"
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
          />

        </div>
      </CustomDialog>

      {/* Edit Transaction Dialog */}
      <CustomDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Transaction"
        description="Update transaction details in the ledger ledger."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleEdit} isLoading={updateMutation.isPending}>
              Save Changes
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 font-sans text-xs">
          
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-muted-foreground select-none">Transaction Flow</span>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTxTypeChange("EXPENSE")}
                className={cn(
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
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
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
                  txType === "INCOME"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => handleTxTypeChange("TRANSFER")}
                className={cn(
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
                  txType === "TRANSFER"
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Transfer
              </button>
            </div>
          </div>

          <CurrencyInput
            label="Transaction Amount"
            placeholder="0.00"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3 text-foreground">
            <CustomSelect
              label="Payment Method"
              value={txPaymentMethodId}
              onChange={setTxPaymentMethodId}
              options={paymentMethods.map((pm) => ({ value: pm.id, label: pm.name }))}
            />

            <CustomSelect
              label={txType === "TRANSFER" ? "Source Account" : "Bank Account"}
              value={txAccountId}
              onChange={setTxAccountId}
              options={(() => {
                const pm = paymentMethods.find((p) => p.id === txPaymentMethodId)
                const list = pm ? getFilteredAccounts(pm.code) : accounts.filter((a) => !a.isArchived)
                // include currently selected account even if archived just in case
                if (selectedTx && !list.some((a) => a.id === selectedTx.accountId)) {
                  const accObj = accounts.find((a) => a.id === selectedTx.accountId)
                  if (accObj) list.push(accObj)
                }
                return list.map((a) => ({ value: a.id, label: a.name }))
              })()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-foreground">
            {txType === "TRANSFER" ? (
              <CustomSelect
                label="Destination Account"
                value={txDestinationAccountId}
                onChange={setTxDestinationAccountId}
                options={accounts
                  .filter(a => !a.isArchived && a.id !== txAccountId && a.type !== "DEBIT_CARD" && a.type !== "UPI")
                  .map((a) => ({ value: a.id, label: a.name }))}
              />
            ) : (
              <CustomSelect
                label="Category type"
                value={txCategoryId}
                onChange={setTxCategoryId}
                isSearchable={true}
                options={categories.filter(c => c.type === txType).map((c) => {
                  const iconObj = icons.find((i) => i.id === c.categoryIconId)
                  const iconKey = iconObj?.iconKey || "FolderOpen"
                  return {
                    value: c.id,
                    label: c.name,
                    icon: renderCategoryIcon(iconKey, c.color || "#64748b")
                  }
                })}
              />
            )}

            <CustomDatePicker
              label="Transaction Date"
              value={txDate}
              onChange={setTxDate}
            />
          </div>

          <CustomInput
            label="Description Note (Optional)"
            placeholder="e.g. Monthly internet subscription"
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
          />

        </div>
      </CustomDialog>

      {/* Delete Confirmation */}
      <CustomDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Transaction?"
        description="Are you sure you want to permanently remove this transaction from the ledger?"
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="danger" size="sm" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete Transaction
            </CustomButton>
          </>
        }
      >
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200/60 rounded-[10px] mt-2 text-amber-800">
          <Info className="size-5 flex-shrink-0" />
          <span className="text-xs leading-normal">
            This will permanently recalculate user account balances and dashboard aggregations.
          </span>
        </div>
      </CustomDialog>

    </div>
  )

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse">
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div className="h-8 w-1/4 bg-muted rounded-[6px]" />
        <div className="h-10 w-32 bg-muted rounded-[10px]" />
      </div>
      <div className="h-16 bg-background-secondary border border-border rounded-[16px] p-4" />
      <div className="bg-card border border-border rounded-[16px] h-96 mt-6" />
    </div>
  )
}
