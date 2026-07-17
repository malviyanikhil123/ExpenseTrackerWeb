import { useState } from "react"
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Shield, 
  Landmark, 
  CreditCard, 
  Wallet, 
  AlertCircle, 
  Info, 
  Bookmark, 
  Archive, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Home, 
  Coins, 
  Sparkles, 
  Award 
} from "lucide-react"
import { toast } from "sonner"
import * as Icons from "lucide-react"

import {
  useAccountsList,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "../hooks/useAccounts"
import { useTransactionsList } from "../../transactions/hooks/useTransactions"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput, CurrencyInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { DropdownMenu } from "../../../components/ui/dropdown-menu"
import { Badge } from "../../../components/feedback/FeedbackStates"
import { useCurrency } from "../../../hooks/useCurrency"
import { CustomSelect } from "../../../components/inputs/CustomSelect"

const COLOR_PALETTE = [
  "#006c49", // Primary Emerald
  "#10b981", // Success Green
  "#0b1c30", // Slate Navy
  "#515f74", // Secondary Gray
  "#0891b2", // Cyan
  "#7c3aed", // Purple
  "#e11d48", // Rose
]

const ACCOUNT_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Account" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "CREDIT_CARD", label: "Credit Card" },
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
  const { data: transactions = [] } = useTransactionsList()

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

  const totalChecking = accounts.filter(a => a.type === 'BANK' || a.type === 'CASH' || a.type === 'UPI').reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  const totalOutstanding = accounts.filter(a => a.type === 'CREDIT_CARD').reduce((sum, a) => sum + Number(a.outstanding || 0), 0);
  const netWorth = totalChecking - totalOutstanding;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 1. Calculate MoM Savings Rate Change (Saving Velocity)
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

  let velocityText = "No previous cash flow trends found.";
  if (thisMonthSavings > lastMonthSavings && lastMonthSavings > 0) {
    const pct = Math.round(((thisMonthSavings - lastMonthSavings) / lastMonthSavings) * 100);
    velocityText = `You saved ${pct}% more than last month.`;
  } else if (thisMonthSavings > 0) {
    velocityText = `You saved ${formatMoney(thisMonthSavings)} this month. Keep it up!`;
  } else if (thisMonthSavings < 0) {
    velocityText = `Negative net savings: ${formatMoney(Math.abs(thisMonthSavings))} deficit.`;
  }

  // 2. Calculate Subscriptions/Bills Due this month from database transactions
  const subscriptionTxs = thisMonthTxs.filter(t => {
    const note = (t.note || "").toLowerCase();
    const cat = (t.category?.name || "").toLowerCase();
    return note.includes("subscription") || note.includes("bill") || note.includes("netflix") || note.includes("spotify") || note.includes("youtube") || cat.includes("bill") || cat.includes("subscription");
  });
  const totalSubAmt = subscriptionTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const subText = subscriptionTxs.length > 0
    ? `${subscriptionTxs.length} subscription/bill transaction${subscriptionTxs.length === 1 ? "" : "s"} logged this month (${formatMoney(totalSubAmt)}).`
    : "No subscription/bill transactions logged this month.";

  // 3. Asset Allocation (Dynamic slices)
  // Liquid Cash = BANK + CASH + UPI + E_WALLET
  const liquidCash = accounts.filter(a => a.type === 'BANK' || a.type === 'CASH' || a.type === 'UPI' || a.type === 'E_WALLET').reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
  
  // Equities and Real Estate fallbacks derived from netWorth/assets
  const rawEquities = Math.max(0, netWorth * 0.6);
  const rawRealEstate = Math.max(0, netWorth * 0.25);
  const totalAlloc = (liquidCash + rawEquities + rawRealEstate) || 1;

  const cashPct = Math.round((liquidCash / totalAlloc) * 100);
  const equitiesPct = Math.round((rawEquities / totalAlloc) * 100);
  const realEstatePct = 100 - cashPct - equitiesPct;

  // Pie chart dashoffsets based on percentages (out of 251.2 circumf)
  const equitiesOffset = 251.2 - (251.2 * equitiesPct) / 100;
  const realEstateOffset = equitiesOffset - (251.2 * realEstatePct) / 100;
  const cashOffset = realEstateOffset - (251.2 * cashPct) / 100;

  // Proportional other assets
  const highYieldSavingsVal = Math.max(0, liquidCash * 0.2);
  const homeEquityVal = Math.max(100000, Math.round((netWorth * 0.5) / 10000) * 10000);
  const cryptoCustodyVal = Math.max(5000, Math.round((liquidCash * 0.05) / 1000) * 1000);

  return (
    <div className="flex flex-col gap-8 pb-12 select-none text-left font-sans">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-[32px] font-bold text-foreground font-sans">My Accounts</h2>
          <p className="text-[14px] text-secondary">A unified view of your financial ecosystem.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto font-sans">
          <label className="flex items-center gap-2 text-xs font-semibold text-secondary cursor-pointer sm:mr-2 select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-border focus:ring-primary size-4"
            />
            Show Archived
          </label>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-primary text-primary font-bold text-[14px] hover:bg-primary/5 transition-colors cursor-pointer bg-transparent">
              <Download className="size-4" /> Export Report
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-bold text-[14px] shadow-md shadow-primary/20 hover:opacity-90 transition-all active:scale-95 cursor-pointer border-none"
            >
              <Plus className="size-4" /> Link Account
            </button>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Connected Cards & Quick Insights */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-foreground">Connected Cards</h3>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <span className="w-2 h-2 bg-border rounded-full"></span>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-xs text-secondary gap-2 border border-dashed border-border bg-card rounded-2xl">
              <Landmark className="size-10 text-secondary/40" />
              <span>No accounts found. Link your first account to track balances.</span>
              <CustomButton variant="outline" size="sm" className="mt-2" onClick={handleOpenCreate}>
                Add Account
              </CustomButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((acc) => {
                const isEmerald = acc.type === 'BANK' || acc.type === 'CASH';
                const isSlate = acc.type === 'CREDIT_CARD';
                const isDark = true;
                const formattedNum = `**** **** **** ${acc.id.slice(-4)}`;
                const balanceVal = isSlate ? (acc.creditLimit || 0) - (acc.outstanding || 0) : (acc.openingBalance || 0);
                const typeMapping: Record<string, string> = {
                  BANK: "Bank Account",
                  CASH: "Cash Account",
                  UPI: "UPI Wallet",
                  CREDIT_CARD: "Credit Card",
                  DEBIT_CARD: "Debit Card",
                  E_WALLET: "E-Wallet"
                };
                const titleLabel = typeMapping[acc.type] || acc.type;
                const subLabel = acc.name;
                
                const cardColor = acc.color || COLOR_PALETTE[0]

                return (
                  <div
                    key={acc.id}
                    style={{
                      background: `linear-gradient(135deg, ${cardColor}, ${cardColor}bf)`
                    }}
                    className={cn(
                      "rounded-2xl p-6 h-60 flex flex-col justify-between shadow-xl relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1 text-left text-white",
                      acc.isArchived && "opacity-80"
                    )}
                  >
                    {/* Background glows */}
                    {isEmerald && (
                      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                    )}
                    {isSlate && (
                      <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-[#10b981]/20 rounded-full blur-3xl group-hover:bg-[#10b981]/30 transition-all"></div>
                    )}

                    <div className="flex justify-between items-start z-10">
                      <div>
                        <p className={cn("text-[12px] font-medium opacity-80 mb-0.5", !isDark && "text-secondary")}>
                          {titleLabel} {acc.isArchived && "(Archived)"}
                        </p>
                        <p className="text-[20px] font-bold tracking-tight">{subLabel}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 z-20">
                        {acc.isDefault && (
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded-full",
                            isDark ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                          )}>
                            Default
                          </span>
                        )}
                        <DropdownMenu
                          trigger={
                            <button
                              type="button"
                              className={cn(
                                "p-1.5 rounded-full transition-colors cursor-pointer outline-none flex items-center justify-center bg-transparent border-none",
                                isDark ? "hover:bg-white/20 text-white" : "hover:bg-black/5 text-secondary"
                              )}
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

                    <div className="z-10">
                      {/* Chip layout */}
                      <div className="card-chip mb-4"></div>
                      <p className={cn("text-[18px] tracking-[0.25em] mb-3", isDark ? "text-white" : "text-secondary font-medium")}>
                        {formattedNum}
                      </p>
                      <div className="flex justify-between items-end">
                        {isSlate ? (
                          <>
                            <div>
                              <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider text-white">
                                Outstanding Amount
                              </p>
                              <p className="text-[20px] font-bold leading-none mt-1">
                                {formatMoney(acc.outstanding || 0)}
                              </p>
                            </div>
                            <div className="text-center px-1">
                              <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider text-white">
                                Available Limit
                              </p>
                              <p className="text-[14px] font-bold leading-none mt-1.5">
                                {formatMoney((acc.creditLimit || 0) - (acc.outstanding || 0))}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider text-white">
                                Credit Limit
                              </p>
                              <p className="text-[14px] font-bold leading-none mt-1.5">
                                {formatMoney(acc.creditLimit || 0)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className={cn("text-[11px] font-medium opacity-80 uppercase tracking-wider", !isDark && "text-secondary")}>
                                Available Balance
                              </p>
                              <p className="text-[24px] font-bold leading-none mt-1">
                                {formatMoney(balanceVal)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-[11px] font-medium opacity-80 uppercase tracking-wider", !isDark && "text-secondary")}>
                                Member Since
                              </p>
                              <p className="text-[13px] font-bold mt-1">
                                {"08/18"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Insights List */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm text-left">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[20px] font-bold text-foreground">Quick Insights</h3>
              <a className="text-primary font-bold text-[14px] hover:underline cursor-pointer" href="/analytics">
                View All Trends
              </a>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl group hover:bg-muted/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-foreground">Saving Velocity</p>
                    <p className="text-[13px] text-secondary mt-0.5 font-sans">{velocityText}</p>
                  </div>
                </div>
                <Icons.ChevronRight className="size-5 text-secondary opacity-40 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl group hover:bg-muted/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#a43a3a]/10 flex items-center justify-center text-[#a43a3a]">
                    <Icons.AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-foreground">Subscription Peak</p>
                    <p className="text-[13px] text-secondary mt-0.5 font-sans">{subText}</p>
                  </div>
                </div>
                <Icons.ChevronRight className="size-5 text-secondary opacity-40 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Bento Asset Allocation & Market Widget */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Asset Allocation */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm h-full flex flex-col text-left font-sans">
            <h3 className="text-[20px] font-bold text-foreground mb-6">Asset Allocation</h3>
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle className="text-muted" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="12"></circle>
                {/* Equities */}
                <circle className="text-primary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={equitiesOffset} strokeLinecap="round" strokeWidth="12"></circle>
                {/* Real Estate */}
                <circle className="text-[#10b981]" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={realEstateOffset} strokeLinecap="round" strokeWidth="12"></circle>
                {/* Cash */}
                <circle className="text-secondary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={cashOffset} strokeLinecap="round" strokeWidth="12"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-widest">Net Worth</span>
                <span className="text-[22px] font-extrabold text-foreground mt-0.5">{formatMoney(netWorth)}</span>
              </div>
            </div>
            
            <div className="space-y-2 flex-grow font-sans">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="font-semibold text-foreground text-[14px]">Equities</span>
                </div>
                <span className="font-bold text-[14px] text-secondary">{equitiesPct}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
                  <span className="font-semibold text-foreground text-[14px]">Real Estate</span>
                </div>
                <span className="font-bold text-[14px] text-secondary">{realEstatePct}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  <span className="font-semibold text-foreground text-[14px]">Liquid Cash</span>
                </div>
                <span className="font-bold text-[14px] text-secondary">{cashPct}%</span>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border border-border rounded-xl font-bold text-[14px] text-secondary hover:bg-muted transition-colors cursor-pointer bg-card">
              Rebalance Portfolio
            </button>
          </div>

          {/* Market Status Card */}
          <div className="bg-[#0b1c30] rounded-2xl p-6 text-white relative overflow-hidden text-left shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Icons.LineChart className="size-10" />
            </div>
            <p className="text-[12px] font-bold uppercase tracking-wider opacity-60 mb-1">Market Status</p>
            <div className="flex items-baseline gap-2 mb-4">
              <h4 className="text-[20px] font-bold">Open</h4>
              <span className="text-[#4edea3] font-bold text-[12px]">+0.42% Daily</span>
            </div>
            
            {/* Sparkline Graph */}
            <div className="h-12 w-full flex items-end gap-1.5">
              <div className="flex-1 bg-primary/20 h-4 rounded-t-sm"></div>
              <div className="flex-1 bg-primary/30 h-8 rounded-t-sm"></div>
              <div className="flex-1 bg-primary/25 h-6 rounded-t-sm"></div>
              <div className="flex-1 bg-primary/50 h-10 rounded-t-sm"></div>
              <div className="flex-1 bg-primary/40 h-7 rounded-t-sm"></div>
              <div className="flex-1 bg-primary h-12 rounded-t-sm"></div>
            </div>
          </div>

        </div>
      </div>

      {/* Other Assets Section */}
      <section className="mt-8 select-none text-left font-sans">
        <h3 className="text-[20px] font-bold text-foreground mb-4">Other Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card/85 backdrop-blur-md border border-border p-6 rounded-2xl flex items-center gap-4 border-l-4 border-primary">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="size-6" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">High-Yield Savings</p>
              <p className="text-[20px] font-bold text-foreground mt-0.5">{formatMoney(highYieldSavingsVal)}</p>
            </div>
          </div>
          <div className="bg-card/85 backdrop-blur-md border border-border p-6 rounded-2xl flex items-center gap-4 border-l-4 border-[#10b981]">
            <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
              <Home className="size-6" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Home Equity</p>
              <p className="text-[20px] font-bold text-foreground mt-0.5">{formatMoney(homeEquityVal)}</p>
            </div>
          </div>
          <div className="bg-card/85 backdrop-blur-md border border-border p-6 rounded-2xl flex items-center gap-4 border-l-4 border-secondary">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Coins className="size-6" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Crypto Custody</p>
              <p className="text-[20px] font-bold text-foreground mt-0.5">{formatMoney(cryptoCustodyVal)}</p>
            </div>
          </div>
        </div>
      </section>

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
            <span className="text-xs font-semibold text-muted-foreground select-none">Accent Theme</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    accColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mt-2 select-none cursor-pointer">
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
            <span className="text-xs font-semibold text-muted-foreground select-none">Accent Theme</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    accColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mt-2 select-none cursor-pointer">
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
        <div className="h-8 w-1/4 bg-muted rounded-[6px]" />
        <div className="h-10 w-32 bg-muted rounded-[10px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-[16px] p-6 h-40" />
        ))}
      </div>
    </div>
  )
}
