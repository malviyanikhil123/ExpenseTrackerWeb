import { useState } from "react"
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
import { useCategoriesList } from "../../categories/hooks/useCategories"
import { useAccountsList } from "../../accounts/hooks/useAccounts"

import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput, CurrencyInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { Badge } from "../../../components/feedback/FeedbackStates"
import { CustomPagination } from "../../../components/pagination/CustomPagination"

export default function TransactionsPage() {
  const location = useLocation()
  const initialTypeFilter = location.state?.filterType || undefined

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"INCOME" | "EXPENSE" | undefined>(initialTypeFilter)
  const [filterAccountId, setFilterAccountId] = useState<string>("")
  const [filterCategoryId, setFilterCategoryId] = useState<string>("")
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
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [txAccountId, setTxAccountId] = useState("")
  const [txCategoryId, setTxCategoryId] = useState("")
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0])

  // Pagination page state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Dropdown list hooks
  const { data: categories = [] } = useCategoriesList()
  const { data: accounts = [] } = useAccountsList()
  
  const queryFilters = {
    type: filterType,
    accountId: filterAccountId || undefined,
    categoryId: filterCategoryId || undefined,
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

  const handleOpenCreate = () => {
    setTxDesc("")
    setTxAmount("")
    setTxType("EXPENSE")
    setTxAccountId(accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || "")
    setTxCategoryId(categories[0]?.id || "")
    setTxDate(new Date().toISOString().split("T")[0])
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (tx: any) => {
    setSelectedTx(tx)
    setTxDesc(tx.note || "")
    setTxAmount(String(tx.amount))
    setTxType(tx.type)
    setTxAccountId(tx.accountId)
    setTxCategoryId(tx.categoryId)
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
    if (!txAccountId || !txCategoryId) {
      toast.error("Please select an Account and a Category.")
      return
    }
    createMutation.mutate(
      {
        note: txDesc.trim() || undefined,
        amount: Number(txAmount),
        type: txType,
        accountId: txAccountId,
        categoryId: txCategoryId,
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
    updateMutation.mutate(
      {
        id: selectedTx.id,
        data: {
          note: txDesc.trim() || undefined,
          amount: Number(txAmount),
          type: txType,
          accountId: txAccountId,
          categoryId: txCategoryId,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500">Record payments, manage expenses, and view cash flow receipts.</p>
        </div>
        <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Transaction
        </CustomButton>
      </div>

      {/* Toolbar controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-gray-50/50 p-4 rounded-[16px] border border-gray-200/80">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search description note..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 w-full pl-9 pr-4 bg-white border border-gray-200 rounded-[10px] text-xs outline-none focus:border-primary transition-colors font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200"
              onClick={() => setIsFilterPanelOpen(true)}
            >
              <SlidersHorizontal className="size-3.5 text-gray-500" />
              Filters
              {(filterType || filterAccountId || filterCategoryId || filterStartDate || filterEndDate) && (
                <div className="size-2 rounded-full bg-primary" />
              )}
            </CustomButton>
          </div>
        </div>

        {/* Filter Chips list */}
        {(filterType || filterAccountId || filterCategoryId || filterStartDate || filterEndDate) && (
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
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-gray-400 gap-2 border border-dashed border-gray-200 rounded-[16px]">
          <FolderOpen className="size-10" />
          <span>No transactions fit the current filter query.</span>
          <CustomButton variant="outline" size="sm" className="mt-2" onClick={handleOpenCreate}>
            Add Transaction
          </CustomButton>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-[16px] overflow-hidden shadow-card">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold select-none">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Account</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-gray-400">
                      {format(new Date(tx.transactionDate), "dd MMM yyyy")}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{tx.note || "Transaction"}</td>
                    <td className="py-3.5 px-6">{getCategoryName(tx.categoryId)}</td>
                    <td className="py-3.5 px-6">{getAccountName(tx.accountId)}</td>
                    <td className="py-3.5 px-6">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wide",
                        tx.type === "INCOME" ? "text-success" : "text-danger"
                      )}>
                        {tx.type === "INCOME" ? (
                          <ArrowDownLeft className="size-3.5" />
                        ) : (
                          <ArrowUpRight className="size-3.5" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-gray-900">
                      ${Number(tx.amount).toFixed(2)}
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
                className="bg-white border border-gray-200 rounded-[12px] p-5 shadow-card flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">{tx.note || "Transaction"}</span>
                    <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mt-0.5">
                      {getCategoryName(tx.categoryId)} • {getAccountName(tx.accountId)}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    tx.type === "INCOME" ? "text-success" : "text-gray-900"
                  )}>
                    {tx.type === "INCOME" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-gray-50 pt-3 text-2xs text-gray-400">
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
        <div className="flex flex-col gap-4 py-2 text-xs font-sans">
          
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 font-semibold select-none">Flow Type</span>
            <select
              value={filterType || ""}
              onChange={(e) => setFilterType(e.target.value ? (e.target.value as any) : undefined)}
              className="h-10 w-full px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
            >
              <option value="">All Transactions</option>
              <option value="INCOME">Income Deposits</option>
              <option value="EXPENSE">Expense Purchases</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 font-semibold select-none">Target Account</span>
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="h-10 w-full px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 font-semibold select-none">Category classification</span>
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="h-10 w-full px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 font-semibold select-none">Start Date</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="h-10 px-3.5 border border-gray-200 rounded-[10px] outline-none focus:border-primary bg-white transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 font-semibold select-none">End Date</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="h-10 px-3.5 border border-gray-200 rounded-[10px] outline-none focus:border-primary bg-white transition-colors"
              />
            </div>
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
            <span className="font-semibold text-gray-600 select-none">Transaction Flow</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTxType("EXPENSE")}
                className={cn(
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
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
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
                  txType === "INCOME"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                Income
              </button>
            </div>
          </div>

          <CurrencyInput
            label="Transaction Amount"
            placeholder="0.00"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-600 select-none">Bank Account</span>
              <select
                value={txAccountId}
                onChange={(e) => setTxAccountId(e.target.value)}
                className="h-10 px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
              >
                {accounts.filter(a => !a.isArchived).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-600 select-none">Category type</span>
              <select
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                className="h-10 px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
              >
                {categories.filter(c => c.type === txType).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-gray-600 select-none">Transaction Date</span>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="h-10 px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
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
            <span className="font-semibold text-gray-600 select-none">Transaction Flow</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTxType("EXPENSE")}
                className={cn(
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
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
                  "h-10 px-4 rounded-[10px] border font-semibold select-none transition-colors cursor-pointer",
                  txType === "INCOME"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                Income
              </button>
            </div>
          </div>

          <CurrencyInput
            label="Transaction Amount"
            placeholder="0.00"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-600 select-none">Bank Account</span>
              <select
                value={txAccountId}
                onChange={(e) => setTxAccountId(e.target.value)}
                className="h-10 px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
              >
                {accounts.filter(a => !a.isArchived || a.id === selectedTx?.accountId).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-600 select-none">Category type</span>
              <select
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                className="h-10 px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
              >
                {categories.filter(c => c.type === txType).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-gray-600 select-none">Transaction Date</span>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="h-10 px-3.5 border border-gray-200 rounded-[10px] bg-white outline-none focus:border-primary transition-colors"
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
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
        <div className="h-10 w-32 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="h-16 bg-gray-50 border border-gray-100 rounded-[16px] p-4" />
      <div className="bg-white border border-gray-200 rounded-[16px] h-96 mt-6" />
    </div>
  )
}
