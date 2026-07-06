import { useState } from "react"
import { Plus, Search, MoreVertical, Edit2, Trash2, Calendar, AlertCircle, Info, DollarSign, History, User } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import {
  useDebtsList,
  useCreateDebt,
  useUpdateDebt,
  useDeleteDebt,
  useRepaymentsList,
  useCreateRepayment,
} from "../hooks/useDebts"
import { useAccountsList } from "../../accounts/hooks/useAccounts"

import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput, CurrencyInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { Badge } from "../../../components/feedback/FeedbackStates"
import { DropdownMenu } from "../../../components/ui/dropdown-menu"
import { useCurrency } from "../../../hooks/useCurrency"
import { CustomSelect } from "../../../components/inputs/CustomSelect"

export default function DebtsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"BORROW" | "LENT">("BORROW")
  const { format: formatMoney } = useCurrency()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRepaymentsOpen, setIsRepaymentsOpen] = useState(false)
  const [isAddRepaymentOpen, setIsAddRepaymentOpen] = useState(false)

  const [selectedDebt, setSelectedDebt] = useState<any>(null)

  // Form Fields
  const [debtParty, setDebtParty] = useState("")
  const [debtAmount, setDebtAmount] = useState("")
  const [debtNotes, setDebtNotes] = useState("")
  const [debtDueDate, setDebtDueDate] = useState("")
  const [debtAccountId, setDebtAccountId] = useState("")

  // Repayment form fields (Section 75)
  const [repayAmount, setRepayAmount] = useState("")
  const [repayNotes, setRepayNotes] = useState("")

  const [filterStatus, setFilterStatus] = useState<"PENDING" | "COMPLETED" | "">("PENDING")

  const { data: debts = [], isLoading, isError, refetch } = useDebtsList({
    type: activeTab,
    status: filterStatus || undefined,
  })
  const { data: accounts = [] } = useAccountsList()

  const createMutation = useCreateDebt()
  const updateMutation = useUpdateDebt()
  const deleteMutation = useDeleteDebt()

  // Repayments Sub-API query and mutation (Section 75)
  const { data: repayments = [], isLoading: isRepaymentsLoading } = useRepaymentsList(selectedDebt?.id || "")
  const createRepaymentMutation = useCreateRepayment()

  const filteredDebts = debts.filter((d) =>
    d.partyName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenCreate = () => {
    setDebtParty("")
    setDebtAmount("")
    setDebtNotes("")
    setDebtDueDate("")
    setDebtAccountId(accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || "")
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (debt: any) => {
    setSelectedDebt(debt)
    setDebtParty(debt.partyName)
    setDebtAmount(String(debt.totalAmount))
    setDebtNotes(debt.notes || "")
    setDebtDueDate(debt.dueDate ? new Date(debt.dueDate).toISOString().split("T")[0] : "")
    setIsEditOpen(true)
  }

  const handleOpenDelete = (debt: any) => {
    setSelectedDebt(debt)
    setIsDeleteOpen(true)
  }

  const handleOpenRepayments = (debt: any) => {
    setSelectedDebt(debt)
    setIsRepaymentsOpen(true)
  }

  const handleCreate = () => {
    if (!debtParty.trim()) {
      toast.error("Person / Party name is required.")
      return
    }
    if (!debtAmount || Number(debtAmount) <= 0) {
      toast.error("Please enter a valid amount.")
      return
    }
    if (!debtAccountId) {
      toast.error("Please select a bank account.")
      return
    }
    createMutation.mutate(
      {
        partyName: debtParty.trim(),
        totalAmount: Number(debtAmount),
        type: activeTab,
        debtDate: new Date().toISOString(),
        dueDate: debtDueDate ? new Date(debtDueDate).toISOString() : undefined,
        notes: debtNotes.trim() || undefined,
        accountId: debtAccountId,
      },
      {
        onSuccess: () => setIsCreateOpen(false),
      }
    )
  }

  const handleEdit = () => {
    if (!debtParty.trim()) {
      toast.error("Person name is required.")
      return
    }
    if (!debtAmount || Number(debtAmount) <= 0) {
      toast.error("Please enter a valid amount.")
      return
    }
    updateMutation.mutate(
      {
        id: selectedDebt.id,
        data: {
          partyName: debtParty.trim(),
          totalAmount: Number(debtAmount),
          dueDate: debtDueDate ? new Date(debtDueDate).toISOString() : undefined,
          notes: debtNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => setIsEditOpen(false),
      }
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(selectedDebt.id, {
      onSuccess: () => setIsDeleteOpen(false),
    })
  }

  const handleCreateRepayment = () => {
    if (!repayAmount || Number(repayAmount) <= 0) {
      toast.error("Please enter a valid repayment amount.")
      return
    }

    const remainingVal = Number(selectedDebt?.remainingAmount || 0)
    if (Number(repayAmount) > remainingVal) {
      toast.error(`Repayment cannot exceed remaining debt balance (${formatMoney(remainingVal)})`)
      return
    }

    createRepaymentMutation.mutate(
      {
        debtId: selectedDebt.id,
        amount: Number(repayAmount),
        repaymentDate: new Date().toISOString(),
        note: repayNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsAddRepaymentOpen(false)
          setRepayAmount("")
          setRepayNotes("")
          // Invalidate and refresh local state
          setSelectedDebt((prev: any) => ({
            ...prev,
            remainingAmount: prev.remainingAmount - Number(repayAmount),
            status: prev.remainingAmount - Number(repayAmount) <= 0 ? "COMPLETED" : "PENDING",
          }))
        },
      }
    )
  }

  if (isLoading) {
    return <DebtsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-danger/10 bg-danger/5 rounded-[16px] max-w-2xl mx-auto mt-12">
        <AlertCircle className="size-12 text-danger mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Failed to fetch Debts</h2>
        <p className="text-sm text-gray-500 mb-6">There was an error communicating with the API.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry
        </CustomButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      
      {/* Header (Section 74) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Debts & Borrowings</h1>
          <p className="text-sm text-muted-foreground">Track money you owe others or payments others owe you.</p>
        </div>
        <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Debt
        </CustomButton>
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card/50 p-4 rounded-[16px] border border-border">
        
        {/* Tab switcher */}
        <div className="flex bg-muted p-1 rounded-[10px] self-start md:self-auto w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("BORROW")}
            className={cn(
              "flex-1 md:flex-none px-5 py-2 rounded-[8px] text-xs font-semibold select-none transition-colors cursor-pointer",
              activeTab === "BORROW" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Borrowed (I owe them)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LENT")}
            className={cn(
              "flex-1 md:flex-none px-5 py-2 rounded-[8px] text-xs font-semibold select-none transition-colors cursor-pointer",
              activeTab === "LENT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Lent (They owe me)
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto md:flex-1 justify-end">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by person name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-4 bg-card text-foreground border border-border rounded-[10px] text-xs outline-none focus:border-primary transition-colors font-sans"
            />
          </div>

          <div className="w-full sm:w-44 select-none">
            <CustomSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as any)}
              options={[
                { value: "", label: "All Statuses" },
                { value: "PENDING", label: "Pending Outstanding" },
                { value: "COMPLETED", label: "Settled / Paid" },
              ]}
              placeholder="Filter by status"
            />
          </div>
        </div>

      </div>

      {/* Cards Grid */}
      {filteredDebts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-2 border border-dashed border-border bg-card rounded-[16px]">
          <User className="size-10" />
          <span>No debt entries found.</span>
          <CustomButton variant="outline" size="sm" className="mt-2" onClick={handleOpenCreate}>
            Record Debt
          </CustomButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDebts.map((debt) => (
            <div
              key={debt.id}
              className={cn(
                "bg-card border rounded-[16px] p-6 shadow-card hover:shadow-md transition-shadow flex flex-col justify-between gap-4 text-card-foreground",
                debt.status === "COMPLETED" ? "border-border/60 bg-muted/20" : "border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800 tracking-tight">{debt.partyName}</span>
                  <span className="text-2xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                    {debt.type === "LENT" ? "Lent Money" : "Borrowed Money"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant={debt.status === "COMPLETED" ? "success" : "warning"}>
                    {debt.status}
                  </Badge>

                  <DropdownMenu
                    trigger={
                      <button
                        type="button"
                        className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    }
                    items={[
                      {
                        label: "Repayments Timeline",
                        icon: <History className="size-3.5" />,
                        onClick: () => handleOpenRepayments(debt),
                      },
                      {
                        label: "Edit Debt",
                        icon: <Edit2 className="size-3.5" />,
                        onClick: () => handleOpenEdit(debt),
                      },
                      {
                        label: "Delete Record",
                        icon: <Trash2 className="size-3.5" />,
                        onClick: () => handleOpenDelete(debt),
                        isDestructive: true,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-50 py-3.5 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xs font-medium text-gray-400 uppercase tracking-wide">Remaining</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatMoney(debt.remainingAmount)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xs font-medium text-gray-400 uppercase tracking-wide">Original</span>
                  <span className="text-xs font-semibold text-gray-500">
                    {formatMoney(debt.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-2xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Due: {debt.dueDate ? format(new Date(debt.dueDate), "d MMM yyyy") : "No due date"}
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenRepayments(debt)}
                  className="font-bold text-primary hover:underline"
                >
                  Repayments &rarr;
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Debt Dialog */}
      <CustomDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Debt Entry"
        description="Insert descriptive borrowings/loans to verify outstanding balances."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleCreate} isLoading={createMutation.isPending}>
              Record Debt
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 text-xs font-sans">
          
          <CustomInput
            label="Person / Party Name"
            placeholder="e.g. Jane Smith"
            value={debtParty}
            onChange={(e) => setDebtParty(e.target.value)}
          />

          <CurrencyInput
            label="Original Amount"
            placeholder="0.00"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
          />

          <CustomSelect
            label="Link Bank Account"
            value={debtAccountId}
            onChange={setDebtAccountId}
            options={accounts.filter(a => !a.isArchived).map((a) => ({ value: a.id, label: a.name }))}
          />

          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-muted-foreground select-none">Due Date (Optional)</span>
            <input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              className="h-10 px-3.5 border border-border rounded-[10px] bg-background text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <CustomInput
            label="Notes / Comments"
            placeholder="e.g. Borrowed for weekend grocery splitting"
            value={debtNotes}
            onChange={(e) => setDebtNotes(e.target.value)}
          />

        </div>
      </CustomDialog>

      {/* Edit Debt Dialog */}
      <CustomDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Debt Record"
        description="Update personal name, total amount, or due parameters."
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
        <div className="flex flex-col gap-4 py-2 text-xs font-sans">
          
          <CustomInput
            label="Person / Party Name"
            placeholder="e.g. Jane Smith"
            value={debtParty}
            onChange={(e) => setDebtParty(e.target.value)}
          />

          <CurrencyInput
            label="Total Amount"
            placeholder="0.00"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
          />

          <div className="flex flex-col gap-1.5 text-foreground">
            <span className="font-semibold text-muted-foreground select-none">Due Date (Optional)</span>
            <input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              className="h-10 px-3.5 border border-border rounded-[10px] bg-background text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <CustomInput
            label="Notes / Comments"
            placeholder="e.g. Splitting laptop purchase"
            value={debtNotes}
            onChange={(e) => setDebtNotes(e.target.value)}
          />

        </div>
      </CustomDialog>

      {/* Repayments timeline sheet dialog (Section 75) */}
      <CustomDialog
        isOpen={isRepaymentsOpen}
        onClose={() => setIsRepaymentsOpen(false)}
        title="Repayment details"
        description={`Audit repayments splits for ${selectedDebt?.partyName}`}
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsRepaymentsOpen(false)}>
              Close
            </CustomButton>
            {selectedDebt?.status !== "COMPLETED" && (
              <CustomButton variant="primary" size="sm" className="gap-2" onClick={() => setIsAddRepaymentOpen(true)}>
                <Plus className="size-4" />
                Add Repayment
              </CustomButton>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 text-xs font-sans">
          
          <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-4 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Remaining Balance</span>
              <span className="text-xl font-bold text-gray-900">
                {formatMoney(selectedDebt?.remainingAmount || 0)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Original Total</span>
              <span className="text-base font-bold text-gray-500">
                {formatMoney(selectedDebt?.totalAmount || 0)}
              </span>
            </div>
          </div>

          <h4 className="font-semibold text-gray-600 border-b border-gray-100 pb-1.5 mt-2">Repayment Timeline</h4>
          
          {isRepaymentsLoading ? (
            <div className="h-20 flex items-center justify-center text-gray-400 text-xs animate-pulse">
              Loading repayments timeline...
            </div>
          ) : repayments.length === 0 ? (
            <div className="h-24 flex flex-col items-center justify-center text-center text-gray-400 text-2xs gap-1 py-4">
              <History className="size-6 text-gray-300" />
              <span>No repayments logged. Click "Add Repayment" to offset debt.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1">
              {repayments.map((repay) => (
                <div key={repay.id} className="bg-card border border-border rounded-[10px] p-3 flex justify-between items-center shadow-2xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{formatMoney(repay.amount)}</span>
                    <span className="text-2xs text-muted-foreground mt-0.5">
                      {format(new Date(repay.repaymentDate), "dd MMM yyyy")}
                    </span>
                  </div>
                  {repay.note && <span className="text-2xs text-muted-foreground italic max-w-[150px] truncate">{repay.note}</span>}
                </div>
              ))}
            </div>
          )}

        </div>
      </CustomDialog>

      {/* Add Repayment Modal (Section 75) */}
      <CustomDialog
        isOpen={isAddRepaymentOpen}
        onClose={() => setIsAddRepaymentOpen(false)}
        title="Add Repayment"
        description="Verify repayment deposit splits."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsAddRepaymentOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleCreateRepayment} isLoading={createRepaymentMutation.isPending}>
              Record Repayment
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 text-xs font-sans">
          <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-[10px] text-gray-600 flex justify-between select-none">
            <span>Outstanding Limit:</span>
            <span className="font-bold">{formatMoney(selectedDebt?.remainingAmount || 0)}</span>
          </div>

          <CurrencyInput
            label="Repayment Amount"
            placeholder="0.00"
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
          />

          <CustomInput
            label="Note / Comments"
            placeholder="e.g. Paid cash split"
            value={repayNotes}
            onChange={(e) => setRepayNotes(e.target.value)}
          />
        </div>
      </CustomDialog>

      {/* Delete Confirmation */}
      <CustomDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Debt Entry?"
        description="Are you sure you want to permanently erase this debt record and its repayment timeline history?"
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="danger" size="sm" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete Debt
            </CustomButton>
          </>
        }
      >
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200/60 rounded-[10px] mt-2 text-amber-800">
          <Info className="size-5 flex-shrink-0" />
          <span className="text-xs leading-normal">
            This will permanently remove records. Verify split details before deleting.
          </span>
        </div>
      </CustomDialog>

    </div>
  )

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }
}

function DebtsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse">
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
        <div className="h-10 w-32 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="h-16 bg-background-secondary border border-border rounded-[16px] p-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-[16px] h-44" />
        ))}
      </div>
    </div>
  )
}
