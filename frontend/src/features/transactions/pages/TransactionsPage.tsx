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

  const filteredTransactions = transactions.filter((tx) =>
    (tx.note || "Transaction").toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Failed to fetch transactions</h2>
        <p className="text-sm text-gray-500 mb-6">There was an error communicating with the database.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry
        </CustomButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      
      {/* Header (Section 73) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">Record payments, manage expenses, and view cash flow receipts.</p>
        </div>
        <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Transaction
        </CustomButton>
      </div>

      {/* Toolbar controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card/50 p-4 rounded-[16px] border border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search description note..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 w-full pl-9 pr-4 bg-card text-foreground border border-border rounded-[10px] text-xs outline-none focus:border-primary transition-colors font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              className="gap-2 border-border"
              onClick={() => setIsFilterPanelOpen(true)}
            >
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              Filters
              {(filterType || filterAccountId || filterCategoryId || filterPaymentMethodId || filterStartDate || filterEndDate) && (
                <div className="size-2 rounded-full bg-primary" />
              )}
            </CustomButton>
          </div>
        </div>

        {/* Filter Chips list */}
        {(filterType || filterAccountId || filterCategoryId || filterPaymentMethodId || filterStartDate || filterEndDate) && (
          <div className="flex flex-wrap gap-2 items-center -mt-2">
            <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Active:</span>
            {filterType && (
              <Badge variant="info" className="gap-1">
                Type: {filterType}
                <X className="size-3 cursor-pointer" onClick={() => setFilterType(undefined)} />
              </Badge>
            )}
            {filterAccountId && (
              <Badge variant="info" className="gap-1">
                Account: {getAccountName(filterAccountId)}
                <X className="size-3 cursor-pointer" onClick={() => setFilterAccountId("")} />
              </Badge>
            )}
            {filterPaymentMethodId && (
              <Badge variant="info" className="gap-1">
                Payment Method: {paymentMethods.find((p) => p.id === filterPaymentMethodId)?.name || "Unknown"}
                <X className="size-3 cursor-pointer" onClick={() => setFilterPaymentMethodId("")} />
              </Badge>
            )}
            {filterCategoryId && (
              <Badge variant="info" className="gap-1">
                Category: {getCategoryName(filterCategoryId)}
                <X className="size-3 cursor-pointer" onClick={() => setFilterCategoryId("")} />
              </Badge>
            )}
            {(filterStartDate || filterEndDate) && (
              <Badge variant="info" className="gap-1">
                Date Range
                <X className="size-3 cursor-pointer" onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }} />
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-2xs font-bold text-danger hover:underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Ledger Table (Desktop) / Cards (Mobile) */}
      {paginatedTransactions.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-2 border border-dashed border-border bg-card rounded-[16px]">
          <FolderOpen className="size-10" />
          <span>No transactions fit the current filter query.</span>
          <CustomButton variant="outline" size="sm" className="mt-2" onClick={handleOpenCreate}>
            Add Transaction
          </CustomButton>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border rounded-[16px] overflow-hidden shadow-card text-card-foreground">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold select-none">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Account</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-muted-foreground">
                      {format(new Date(tx.transactionDate), "dd MMM yyyy")}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-foreground">{tx.note || "Transaction"}</td>
                    <td className="py-3.5 px-6">
                      {tx.type === "TRANSFER" ? `Transfer → ${getAccountName(tx.destinationAccountId || "")}` : getCategoryName(tx.categoryId || "")}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-foreground">{tx.paymentMethod?.name || "Cash"}</td>
                    <td className="py-3.5 px-6">{getAccountName(tx.accountId)}</td>
                    <td className="py-3.5 px-6">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wide",
                        tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-danger" : "text-gray-500"
                      )}>
                        {tx.type === "INCOME" ? (
                          <ArrowDownLeft className="size-3.5" />
                        ) : tx.type === "EXPENSE" ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowLeftRight className="size-3.5" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-foreground">
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer outline-none"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(tx)}
                          className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-full transition-colors cursor-pointer outline-none"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stack Cards List */}
          <div className="flex flex-col gap-4 md:hidden">
            {paginatedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-card border border-border rounded-[12px] p-5 shadow-card flex flex-col gap-3 text-card-foreground"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{tx.note || "Transaction"}</span>
                    <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                      {tx.type === "TRANSFER"
                        ? `Transfer → ${getAccountName(tx.destinationAccountId || "")} via ${tx.paymentMethod?.name || "Cash"}`
                        : `${getCategoryName(tx.categoryId || "")} • ${getAccountName(tx.accountId)} (${tx.paymentMethod?.name || "Cash"})`}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-danger" : "text-gray-500"
                  )}>
                    {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}{formatMoney(tx.amount)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-3 text-2xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {format(new Date(tx.transactionDate), "d MMM yyyy")}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tx)}
                      className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-full text-gray-500 cursor-pointer outline-none"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(tx)}
                      className="p-1.5 hover:bg-danger/5 border border-danger/10 rounded-full text-danger cursor-pointer outline-none"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          )}

        </div>
      )}

      {/* Filter Options Side Panel / Popover */}
      <CustomDialog
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title="Filter Ledger Logs"
        description="Refine transactions displayed in the ledger sheet."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={clearFilters}>
              Reset Filters
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={() => setIsFilterPanelOpen(false)}>
              Apply Query
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 text-xs font-sans text-foreground">
          
          <CustomSelect
            label="Flow Type"
            value={filterType || ""}
            onChange={(val) => setFilterType(val ? (val as any) : undefined)}
            options={[
              { value: "", label: "All Transactions" },
              { value: "INCOME", label: "Income Deposits" },
              { value: "EXPENSE", label: "Expense Purchases" },
            ]}
          />

          <CustomSelect
            label="Target Account"
            value={filterAccountId}
            onChange={setFilterAccountId}
            options={[
              { value: "", label: "All Accounts" },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />

          <CustomSelect
            label="Payment Method"
            value={filterPaymentMethodId}
            onChange={setFilterPaymentMethodId}
            options={[
              { value: "", label: "All Payment Methods" },
              ...paymentMethods.map((pm) => ({ value: pm.id, label: pm.name })),
            ]}
          />

          <CustomSelect
            label="Category classification"
            value={filterCategoryId}
            onChange={setFilterCategoryId}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((c) => {
                const iconObj = icons.find((i) => i.id === c.categoryIconId)
                const iconKey = iconObj?.iconKey || "FolderOpen"
                return {
                  value: c.id,
                  label: `${c.name} (${c.type})`,
                  icon: renderCategoryIcon(iconKey, c.color || "#64748b")
                }
              }),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <CustomDatePicker
              label="Start Date"
              value={filterStartDate}
              onChange={setFilterStartDate}
            />
            <CustomDatePicker
              label="End Date"
              value={filterEndDate}
              onChange={setFilterEndDate}
              align="right"
            />
          </div>

        </div>
      </CustomDialog>

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
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
        <div className="h-10 w-32 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="h-16 bg-background-secondary border border-border rounded-[16px] p-4" />
      <div className="bg-card border border-border rounded-[16px] h-96 mt-6" />
    </div>
  )
}
