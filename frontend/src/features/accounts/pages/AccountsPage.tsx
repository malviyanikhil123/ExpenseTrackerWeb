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

const COLOR_PALETTE = [
  "#706677",
  "#565264",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
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
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (acc: any) => {
    setSelectedAccount(acc)
    setAccName(acc.name)
    setAccType(acc.type)
    setAccDesc(acc.description || "")
    setAccColor(acc.color || COLOR_PALETTE[0])
    setAccDefault(acc.isDefault)
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
    if (!accBalance.trim()) {
      toast.error("Opening balance is required.")
      return
    }
    createMutation.mutate(
      {
        name: accName.trim(),
        type: accType,
        openingBalance: Number(accBalance),
        description: accDesc.trim() || undefined,
        color: accColor,
        isDefault: accDefault,
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
    updateMutation.mutate(
      {
        id: selectedAccount.id,
        data: {
          name: accName.trim(),
          type: accType,
          description: accDesc.trim() || undefined,
          color: accColor,
          isDefault: accDefault,
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Failed to fetch accounts</h2>
        <p className="text-sm text-gray-500 mb-6">There was an error communicating with the database.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry
        </CustomButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      
      {/* Header (Section 72) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500">Manage bank checking accounts, credit cards, or cash wallets.</p>
        </div>
        <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Account
        </CustomButton>
      </div>

      {/* Show archived toggle */}
      <div className="flex justify-end items-center">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 focus:ring-primary size-4"
          />
          Show Archived Accounts
        </label>
      </div>

      {/* Account Cards list (Section 72) */}
      {accounts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-gray-400 gap-2 border border-dashed border-gray-200 rounded-[16px]">
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
                "bg-white border rounded-[16px] p-6 shadow-card hover:shadow-md transition-shadow relative flex flex-col justify-between gap-4",
                acc.isArchived ? "opacity-60 border-gray-100" : "border-gray-200"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="size-11 rounded-[12px] flex items-center justify-center border border-gray-100"
                    style={{ backgroundColor: `${acc.color || COLOR_PALETTE[0]}08` }}
                  >
                    {getAccountIcon(acc.type, acc.color)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 tracking-tight">{acc.name}</span>
                    <span className="text-2xs font-medium text-gray-400 mt-0.5 uppercase tracking-wide">
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
                        className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none"
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

              <div className="flex flex-col gap-1 border-t border-gray-50 pt-4">
                <span className="text-2xs font-medium text-gray-400 uppercase tracking-wider">Current Balance</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${Number(acc.openingBalance || 0).toFixed(2)}
                </span>
                {acc.description && (
                  <p className="text-2xs text-gray-500 mt-1 leading-normal line-clamp-1">{acc.description}</p>
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

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600 select-none">Account Type</span>
            <select
              value={accType}
              onChange={(e) => setAccType(e.target.value)}
              className="h-10 w-full px-3.5 border border-gray-200 rounded-[10px] text-xs outline-none focus:border-primary bg-white transition-colors"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <CurrencyInput
            label="Opening Balance"
            placeholder="0.00"
            value={accBalance}
            onChange={(e) => setAccBalance(e.target.value)}
          />

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

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600 select-none">Account Type</span>
            <select
              value={accType}
              onChange={(e) => setAccType(e.target.value)}
              className="h-10 w-full px-3.5 border border-gray-200 rounded-[10px] text-xs outline-none focus:border-primary bg-white transition-colors"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

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
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
        <div className="h-10 w-32 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-[16px] p-6 h-40" />
        ))}
      </div>
    </div>
  )
}
