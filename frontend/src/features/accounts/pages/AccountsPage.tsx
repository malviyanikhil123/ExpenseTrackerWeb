import { useState } from "react"
import { Plus, MoreVertical, Edit2, Trash2, Shield, Landmark, CreditCard, Wallet, AlertCircle, Info, Bookmark, Archive } from "lucide-react"
import { toast } from "sonner"

import {
  useAccountsList,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "../hooks/useAccounts"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput, CurrencyInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { DropdownMenu } from "../../../components/ui/dropdown-menu"
import { Badge } from "../../../components/feedback/FeedbackStates"
import { useCurrency } from "../../../hooks/useCurrency"
import { CustomSelect } from "../../../components/inputs/CustomSelect"

const COLOR_PALETTE = [
  "#9D6638", // Brown
  "#B0BA99", // Sage Green
  "#4E220F", // Dark Brown
  "#53724D", // Success Text Green
  "#6B5A4C", // Secondary Text
  "#8A7D72", // Muted Text
  "#D9C4A8", // Transfers Light Brown
]

const ACCOUNT_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Account" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "UPI", label: "UPI ID" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
]

export default function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const { format: formatMoney } = useCurrency()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedAccount, setSelectedAccount] = useState<any>(null)

  const [accName, setAccName] = useState("")
  const [accType, setAccType] = useState<any>("BANK")
  const [accBalance, setAccBalance] = useState("")
  const [accDesc, setAccDesc] = useState("")
  const [accColor, setAccColor] = useState(COLOR_PALETTE[0])
  const [accDefault, setAccDefault] = useState(false)

  // Specific account type attributes
  const [accLimit, setAccLimit] = useState("")
  const [accStatementDate, setAccStatementDate] = useState("")
  const [accDueDate, setAccDueDate] = useState("")
  const [accLinkedBankId, setAccLinkedBankId] = useState("")

  const { data: accounts = [], isLoading, isError, refetch } = useAccountsList(showArchived)

  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  const deleteMutation = useDeleteAccount()

  const handleOpenCreate = () => {
    setAccName("")
    setAccType("BANK")
    setAccBalance("")
    setAccDesc("")
    setAccColor(COLOR_PALETTE[0])
    setAccDefault(false)
    setAccLimit("")
    setAccStatementDate("")
    setAccDueDate("")
    setAccLinkedBankId("")
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (acc: any) => {
    setSelectedAccount(acc)
    setAccName(acc.name)
    setAccType(acc.type)
    setAccDesc(acc.description || "")
    setAccColor(acc.color || COLOR_PALETTE[0])
    setAccDefault(acc.isDefault)
    setAccLimit(acc.creditLimit ? String(acc.creditLimit) : "")
    setAccStatementDate(acc.statementDate ? String(acc.statementDate) : "")
    setAccDueDate(acc.dueDate ? String(acc.dueDate) : "")
    setAccLinkedBankId(acc.linkedBankAccountId || "")
    setIsEditOpen(true)
  }

  const handleOpenDelete = (acc: any) => {
    setSelectedAccount(acc)
    setIsDeleteOpen(true)
  }

  const handleCreate = () => {
    if (!accName.trim()) {
      toast.error("Account name is required.")
      return
    }

    const isCredit = accType === "CREDIT_CARD"
    const isLinked = accType === "DEBIT_CARD" || accType === "UPI"

    if (!isCredit && !isLinked && !accBalance.trim()) {
      toast.error("Opening balance is required.")
      return
    }
    if (isCredit && !accLimit.trim()) {
      toast.error("Credit limit is required.")
      return
    }
    if (isLinked && !accLinkedBankId) {
      toast.error("Linked bank account is required.")
      return
    }

    createMutation.mutate(
      {
        name: accName.trim(),
        type: accType,
        openingBalance: isCredit || isLinked ? 0 : Number(accBalance),
        description: accDesc.trim() || undefined,
        color: accColor,
        isDefault: accDefault,
        creditLimit: isCredit ? Number(accLimit) : undefined,
        statementDate: isCredit && accStatementDate ? Number(accStatementDate) : undefined,
        dueDate: isCredit && accDueDate ? Number(accDueDate) : undefined,
        linkedBankAccountId: isLinked ? accLinkedBankId : undefined,
      },
      {
        onSuccess: () => setIsCreateOpen(false),
      }
    )
  }

  const handleEdit = () => {
    if (!accName.trim()) {
      toast.error("Account name is required.")
      return
    }

    const isCredit = accType === "CREDIT_CARD"
    const isLinked = accType === "DEBIT_CARD" || accType === "UPI"

    if (isCredit && !accLimit.trim()) {
      toast.error("Credit limit is required.")
      return
    }
    if (isLinked && !accLinkedBankId) {
      toast.error("Linked bank account is required.")
      return
    }

    updateMutation.mutate(
      {
        id: selectedAccount.id,
        data: {
          name: accName.trim(),
          type: accType,
          description: accDesc.trim() || undefined,
          color: accColor,
          isDefault: accDefault,
          creditLimit: isCredit ? Number(accLimit) : undefined,
          statementDate: isCredit && accStatementDate ? Number(accStatementDate) : null,
          dueDate: isCredit && accDueDate ? Number(accDueDate) : null,
          linkedBankAccountId: isLinked ? accLinkedBankId : null,
        },
      },
      {
        onSuccess: () => setIsEditOpen(false),
      }
    )
  }

  const handleSetDefault = (acc: any) => {
    updateMutation.mutate({
      id: acc.id,
      data: { isDefault: true },
    })
  }

  const handleToggleArchive = (acc: any) => {
    updateMutation.mutate({
      id: acc.id,
      data: { isArchived: !acc.isArchived },
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(selectedAccount.id, {
      onSuccess: () => setIsDeleteOpen(false),
    })
  }

  const getAccountIcon = (type: string, color?: string) => {
    const cls = "size-5"
    switch (type) {
      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return <CreditCard className={cls} style={{ color }} />
      case "BANK":
        return <Landmark className={cls} style={{ color }} />
      case "CASH":
        return <Wallet className={cls} style={{ color }} />
      default:
        return <Shield className={cls} style={{ color }} />
    }
  }

  if (isLoading) {
    return <AccountsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-danger/10 bg-danger/5 rounded-[16px] max-w-2xl mx-auto mt-12">
        <AlertCircle className="size-12 text-danger mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-1">Failed to fetch accounts</h2>
        <p className="text-sm text-muted-foreground mb-6">There was an error communicating with the database.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry
        </CustomButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      
      {/* Header (Section 72) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[32px] font-bold leading-[40px] text-foreground">Accounts</h1>
          <p className="text-[14px] font-normal text-muted-foreground">Manage bank checking accounts, credit cards, or cash wallets.</p>
        </div>
        <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Account
        </CustomButton>
      </div>

      {/* Show archived toggle */}
      <div className="flex justify-end items-center">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-border focus:ring-primary size-4"
          />
          Show Archived Accounts
        </label>
      </div>

      {/* Account Cards list (Section 72) */}
      {accounts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-2 border border-dashed border-border bg-card rounded-[16px]">
          <Landmark className="size-10" />
          <span>No accounts found. Create your first account to track balances.</span>
          <CustomButton variant="outline" size="sm" className="mt-2" onClick={handleOpenCreate}>
            Add Account
          </CustomButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={cn(
                "bg-card border rounded-[16px] p-6 shadow-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-in-out relative flex flex-col justify-between gap-5 text-card-foreground",
                acc.isArchived ? "opacity-80 border-border/80" : "border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="size-11 rounded-[12px] flex items-center justify-center border border-border"
                    style={{ backgroundColor: `${acc.color || COLOR_PALETTE[0]}08` }}
                  >
                    {getAccountIcon(acc.type, acc.color)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-foreground tracking-tight">{acc.name}</span>
                    <span className="text-2xs font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">
                      {acc.type.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {acc.isDefault && <Badge variant="info">Default</Badge>}
                  {acc.isArchived && <Badge variant="default">Archived</Badge>}
                  
                  <DropdownMenu
                    trigger={
                      <button
                        type="button"
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    }
                    items={[
                      {
                        label: "Edit Account",
                        icon: <Edit2 className="size-3.5" />,
                        onClick: () => handleOpenEdit(acc),
                      },
                      ...(!acc.isDefault && !acc.isArchived
                        ? [
                            {
                              label: "Set Default",
                              icon: <Bookmark className="size-3.5" />,
                              onClick: () => handleSetDefault(acc),
                            },
                          ]
                        : []),
                      {
                        label: acc.isArchived ? "Unarchive" : "Archive",
                        icon: <Archive className="size-3.5" />,
                        onClick: () => handleToggleArchive(acc),
                      },
                      {
                        label: "Delete",
                        icon: <Trash2 className="size-3.5" />,
                        onClick: () => handleOpenDelete(acc),
                        isDestructive: true,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-4">
                {acc.type === "CREDIT_CARD" ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Limit</span>
                      <span className="text-xs font-bold text-foreground">{formatMoney(acc.creditLimit || 0)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Owed</span>
                      <span className="text-xs font-bold text-danger">{formatMoney(acc.outstanding || 0)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Available</span>
                      <span className="text-xs font-bold text-success">{formatMoney(acc.availableCredit || 0)}</span>
                    </div>
                  </div>
                ) : acc.type === "DEBIT_CARD" || acc.type === "UPI" ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Linked Bank Account</span>
                    <span className="text-sm font-bold text-foreground">
                      {accounts.find((a: any) => a.id === acc.linkedBankAccountId)?.name || "Unknown Account"}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Current Balance</span>
                    <span className="text-[32px] font-extrabold text-foreground leading-none mt-1">
                      {formatMoney(acc.openingBalance || 0)}
                    </span>
                  </div>
                )}
                {acc.description && (
                  <p className="text-xs text-muted-foreground mt-2 leading-normal line-clamp-1">{acc.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Dialog (Section 72) */}
      <CustomDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Account"
        description="Register a new financial checking/credit account."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleCreate} isLoading={createMutation.isPending}>
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

          <CustomSelect
            label="Account Type"
            value={accType}
            onChange={(val) => setAccType(val as any)}
            options={ACCOUNT_TYPES}
          />

          {accType !== "CREDIT_CARD" && accType !== "DEBIT_CARD" && accType !== "UPI" && (
            <CurrencyInput
              label="Opening Balance"
              placeholder="0.00"
              value={accBalance}
              onChange={(e) => setAccBalance(e.target.value)}
            />
          )}

          {accType === "CREDIT_CARD" && (
            <>
              <CurrencyInput
                label="Credit Limit"
                placeholder="0.00"
                value={accLimit}
                onChange={(e) => setAccLimit(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Statement Date (1-31)"
                  type="number"
                  placeholder="e.g. 15"
                  value={accStatementDate}
                  onChange={(e) => setAccStatementDate(e.target.value)}
                />
                <CustomInput
                  label="Due Date (1-31)"
                  type="number"
                  placeholder="e.g. 5"
                  value={accDueDate}
                  onChange={(e) => setAccDueDate(e.target.value)}
                />
              </div>
            </>
          )}

          {(accType === "DEBIT_CARD" || accType === "UPI") && (
            <CustomSelect
              label="Linked Bank Account"
              value={accLinkedBankId}
              onChange={(val) => setAccLinkedBankId(val)}
              options={accounts
                .filter((a: any) => a.type === "BANK")
                .map((a: any) => ({ value: a.id, label: a.name }))}
            />
          )}

          <CustomInput
            label="Description (Optional)"
            placeholder="e.g. Primary checking account for payroll"
            value={accDesc}
            onChange={(e) => setAccDesc(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-600 select-none">Accent Theme</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    accColor === color ? "border-gray-900 scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mt-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={accDefault}
              onChange={(e) => setAccDefault(e.target.checked)}
              className="rounded border-gray-300 focus:ring-primary size-4"
            />
            Set as default account
          </label>
        </div>
      </CustomDialog>

      {/* Edit Account Dialog */}
      <CustomDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Account"
        description="Modify the account specifications, theme color, or default parameters."
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
        <div className="flex flex-col gap-4 py-2">
          <CustomInput
            label="Account Name"
            placeholder="e.g. Chase Checkings"
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
          />

          <CustomSelect
            label="Account Type"
            value={accType}
            onChange={(val) => setAccType(val as any)}
            options={ACCOUNT_TYPES}
          />

          {accType === "CREDIT_CARD" && (
            <>
              <CurrencyInput
                label="Credit Limit"
                placeholder="0.00"
                value={accLimit}
                onChange={(e) => setAccLimit(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Statement Date (1-31)"
                  type="number"
                  placeholder="e.g. 15"
                  value={accStatementDate}
                  onChange={(e) => setAccStatementDate(e.target.value)}
                />
                <CustomInput
                  label="Due Date (1-31)"
                  type="number"
                  placeholder="e.g. 5"
                  value={accDueDate}
                  onChange={(e) => setAccDueDate(e.target.value)}
                />
              </div>
            </>
          )}

          {(accType === "DEBIT_CARD" || accType === "UPI") && (
            <CustomSelect
              label="Linked Bank Account"
              value={accLinkedBankId}
              onChange={(val) => setAccLinkedBankId(val)}
              options={accounts
                .filter((a: any) => a.type === "BANK")
                .map((a: any) => ({ value: a.id, label: a.name }))}
            />
          )}

          <CustomInput
            label="Description (Optional)"
            placeholder="e.g. Shared household account"
            value={accDesc}
            onChange={(e) => setAccDesc(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-600 select-none">Accent Theme</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    accColor === color ? "border-gray-900 scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mt-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={accDefault}
              onChange={(e) => setAccDefault(e.target.checked)}
              className="rounded border-gray-300 focus:ring-primary size-4"
            />
            Set as default account
          </label>
        </div>
      </CustomDialog>

      {/* Delete Confirmation */}
      <CustomDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Account?"
        description="Are you sure you want to permanently delete this account? Any associated transaction logs will be affected."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="danger" size="sm" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete Account
            </CustomButton>
          </>
        }
      >
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200/60 rounded-[10px] mt-2 text-amber-800">
          <Info className="size-5 flex-shrink-0" />
          <span className="text-xs leading-normal">
            To preserve transaction records without seeing the account in lists, we recommend using the **Archive** action instead.
          </span>
        </div>
      </CustomDialog>

    </div>
  )

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }
}

function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse">
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
        <div className="h-10 w-32 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-[16px] p-6 h-40" />
        ))}
      </div>
    </div>
  )
}
