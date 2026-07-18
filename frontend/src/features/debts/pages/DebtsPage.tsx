import { useState } from "react"
import { Plus, Search, MoreVertical, Edit2, Trash2, Calendar, AlertCircle, Info, DollarSign, History, User, TrendingUp, Award, Bookmark } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  generateWhatsAppLink,
  openWhatsApp,
  generateDebtReminderMessage,
  generateRepaymentReminderMessage,
} from "../../../utils/whatsapp"

import * as Icons from "lucide-react"
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
import { useAuthStore } from "../../../store/authStore"
import { CustomSelect } from "../../../components/inputs/CustomSelect"
import { CustomDatePicker } from "../../../components/inputs/CustomDatePicker"
import { cn } from "../../../lib/utils"

export default function DebtsPage() {
  const user = useAuthStore((state) => state.user)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"BORROW" | "LENT">("BORROW")
  const { format: formatMoney } = useCurrency()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRepaymentsOpen, setIsRepaymentsOpen] = useState(false)
  const [isAddRepaymentOpen, setIsAddRepaymentOpen] = useState(false)
  const [isRepaymentConfirmOpen, setIsRepaymentConfirmOpen] = useState(false)
  const [lastRepaymentAmount, setLastRepaymentAmount] = useState(0)
  const [isDebtConfirmOpen, setIsDebtConfirmOpen] = useState(false)
  const [createdDebt, setCreatedDebt] = useState<any>(null)

  const [selectedDebt, setSelectedDebt] = useState<any>(null)

  // Form Fields
  const [debtParty, setDebtParty] = useState("")
  const [debtPhone, setDebtPhone] = useState("")
  const [debtAmount, setDebtAmount] = useState("")
  const [debtNotes, setDebtNotes] = useState("")
  const [debtDueDate, setDebtDueDate] = useState("")
  const [debtDate, setDebtDate] = useState("")
  const [debtAccountId, setDebtAccountId] = useState("")

  // Repayment form fields (Section 75)
  const [repayAmount, setRepayAmount] = useState("")
  const [repayNotes, setRepayNotes] = useState("")
  const [repayAccountId, setRepayAccountId] = useState("")

  const [filterStatus, setFilterStatus] = useState<"PENDING" | "COMPLETED" | "">("PENDING")
  const [lentPage, setLentPage] = useState(1)
  const [borrowPage, setBorrowPage] = useState(1)

  const { data: debts = [], isLoading, isError, refetch } = useDebtsList()
  const { data: accounts = [] } = useAccountsList()

  const createMutation = useCreateDebt()
  const updateMutation = useUpdateDebt()
  const deleteMutation = useDeleteDebt()

  // Repayments Sub-API query and mutation (Section 75)
  const { data: repayments = [], isLoading: isRepaymentsLoading } = useRepaymentsList(selectedDebt?.id || "")
  const createRepaymentMutation = useCreateRepayment()

  const filteredDebts = debts.filter((d) => {
    const matchesSearch = d.partyName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus ? d.status === filterStatus : true
    return matchesSearch && matchesStatus
  })

  const handleOpenCreate = () => {
    setDebtParty("")
    setDebtPhone("")
    setDebtAmount("")
    setDebtNotes("")
    setDebtDueDate("")
    setDebtDate(new Date().toISOString().split("T")[0])
    setDebtAccountId(accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || "")
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (debt: any) => {
    setSelectedDebt(debt)
    setDebtParty(debt.partyName)
    setDebtPhone(debt.phoneNumber || "")
    setDebtAmount(String(debt.totalAmount))
    setDebtNotes(debt.note || "")
    setDebtDueDate(debt.dueDate ? new Date(debt.dueDate).toISOString().split("T")[0] : "")
    setDebtDate(debt.debtDate ? new Date(debt.debtDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0])
    setDebtAccountId(debt.accountId || "")
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
    if (debtPhone.trim() && !/^\+?\d+$/.test(debtPhone.trim())) {
      toast.error("Phone number must contain only digits and an optional '+' prefix.")
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
        phoneNumber: debtPhone.trim() || undefined,
        totalAmount: Number(debtAmount),
        type: activeTab,
        debtDate: debtDate ? new Date(debtDate).toISOString() : new Date().toISOString(),
        dueDate: debtDueDate ? new Date(debtDueDate).toISOString() : undefined,
        note: debtNotes.trim() || undefined,
        accountId: debtAccountId,
      },
      {
        onSuccess: (newDebt) => {
          setIsCreateOpen(false)
          setCreatedDebt(newDebt)
          setIsDebtConfirmOpen(true)
        },
      }
    )
  }

  const handleEdit = () => {
    if (!debtParty.trim()) {
      toast.error("Person name is required.")
      return
    }
    if (debtPhone.trim() && !/^\+?\d+$/.test(debtPhone.trim())) {
      toast.error("Phone number must contain only digits and an optional '+' prefix.")
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
          phoneNumber: debtPhone.trim() || null,
          totalAmount: Number(debtAmount),
          debtDate: debtDate ? new Date(debtDate).toISOString() : undefined,
          dueDate: debtDueDate ? new Date(debtDueDate).toISOString() : undefined,
          note: debtNotes.trim() || undefined,
          accountId: debtAccountId,
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

    if (!repayAccountId) {
      toast.error("Please select a payment account.")
      return
    }

    const remainingVal = Number(selectedDebt?.remainingAmount || 0)
    if (Number(repayAmount) > remainingVal) {
      toast.error(`Repayment cannot exceed remaining debt balance (${formatMoney(remainingVal)})`)
      return
    }

    const amountNum = Number(repayAmount)

    createRepaymentMutation.mutate(
      {
        debtId: selectedDebt.id,
        accountId: repayAccountId,
        amount: amountNum,
        repaymentDate: new Date().toISOString(),
        note: repayNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsAddRepaymentOpen(false)
          setRepayAmount("")
          setRepayNotes("")
          setRepayAccountId("")
          setLastRepaymentAmount(amountNum)
          
          // Invalidate and refresh local state
          setSelectedDebt((prev: any) => ({
            ...prev,
            remainingAmount: prev.remainingAmount - amountNum,
            status: prev.remainingAmount - amountNum <= 0 ? "COMPLETED" : "PENDING",
          }))

          setIsRepaymentConfirmOpen(true)
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

  const totalLent = debts.filter(d => d.type === 'LENT').reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0);
  const totalBorrowed = debts.filter(d => d.type === 'BORROW').reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0);
  const netPosition = totalLent - totalBorrowed;

  const totalLentPaid = debts.filter(d => d.type === 'LENT').reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.remainingAmount)), 0);
  const totalLentOriginal = debts.filter(d => d.type === 'LENT').reduce((sum, d) => sum + Number(d.totalAmount), 0);
  const collectionRate = totalLentOriginal > 0 ? Math.round((totalLentPaid / totalLentOriginal) * 100) : 100;

  const pendingBorrowDebts = debts.filter(d => d.type === 'BORROW' && d.status === 'PENDING' && d.dueDate);
  const nextDueDateStr = pendingBorrowDebts.length > 0 
    ? format(new Date(pendingBorrowDebts.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0].dueDate!), "MMM do")
    : "No dues upcoming";
  const paymentsDueCount = debts.filter(d => d.type === 'BORROW' && d.status === 'PENDING').length;

  const lentList = filteredDebts.filter(d => d.type === 'LENT');
  const borrowList = filteredDebts.filter(d => d.type === 'BORROW');

  const DEBTS_PER_PAGE = 4;

  const totalLentPages = Math.ceil(lentList.length / DEBTS_PER_PAGE) || 1;
  const clampedLentPage = Math.min(lentPage, totalLentPages);
  const paginatedLentList = lentList.slice((clampedLentPage - 1) * DEBTS_PER_PAGE, clampedLentPage * DEBTS_PER_PAGE);

  const totalBorrowPages = Math.ceil(borrowList.length / DEBTS_PER_PAGE) || 1;
  const clampedBorrowPage = Math.min(borrowPage, totalBorrowPages);
  const paginatedBorrowList = borrowList.slice((clampedBorrowPage - 1) * DEBTS_PER_PAGE, clampedBorrowPage * DEBTS_PER_PAGE);

  // Find the borrowed debt with highest remaining balance
  const highestBorrowed = borrowList.sort((a, b) => Number(b.remainingAmount) - Number(a.remainingAmount))[0];
  const highestLent = lentList.sort((a, b) => Number(b.remainingAmount) - Number(a.remainingAmount))[0];

  let smartStrategyText = "All debts and lendings are settled. Maintain this clean sheet to optimize your financial wellness!";
  if (highestBorrowed && highestLent) {
    smartStrategyText = `Your highest outstanding debt is with ${highestBorrowed.partyName} at ${formatMoney(highestBorrowed.remainingAmount)}. Redirecting collections from ${highestLent.partyName} (${formatMoney(highestLent.remainingAmount)}) could help settle this balance.`;
  } else if (highestBorrowed) {
    smartStrategyText = `Your highest outstanding debt is with ${highestBorrowed.partyName} at ${formatMoney(highestBorrowed.remainingAmount)}. We recommend setting up systematic monthly repayments to clear this liability.`;
  } else if (highestLent) {
    smartStrategyText = `You have an outstanding collection of ${formatMoney(highestLent.remainingAmount)} from ${highestLent.partyName}. Following up regularly will bolster your cash reserves.`;
  }

  // Group borrowed debts by due date month to construct timeline data
  const getRepaymentTimeline = () => {
    const borrowDues = debts.filter(d => d.type === 'BORROW' && d.dueDate);
    if (borrowDues.length === 0) {
      return [
        { label: "OCT", amount: 0, heightPct: 5 },
        { label: "NOV", amount: 0, heightPct: 5 },
        { label: "DEC", amount: 0, heightPct: 5 },
        { label: "JAN", amount: 0, heightPct: 5 },
        { label: "FEB", amount: 0, heightPct: 5 },
        { label: "MAR", amount: 0, heightPct: 5 }
      ];
    }
    
    // Sort by due date ascending
    const sortedDues = [...borrowDues].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    const monthlyGroups: Record<string, number> = {};
    sortedDues.forEach(d => {
      const mStr = format(new Date(d.dueDate!), "MMM yyyy");
      // Use totalAmount to reflect the debt in the timeline even when repaid
      monthlyGroups[mStr] = (monthlyGroups[mStr] || 0) + Number(d.totalAmount);
    });

    const entries = Object.entries(monthlyGroups);
    const maxAmount = Math.max(...entries.map(e => e[1])) || 1;
    return entries.map(([month, amount]) => ({
      label: month.toUpperCase(),
      amount,
      heightPct: Math.max(5, Math.min(100, Math.round((amount / maxAmount) * 100)))
    }));
  };
  const timelineData = getRepaymentTimeline();
  const maxTimelineLabel = timelineData.length > 0 ? timelineData[timelineData.length - 1].label : "N/A";

  return (
    <div className="flex flex-col gap-6 pb-12 select-none text-left">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 border-b border-border pb-5">
        <div>
          <h2 className="text-[32px] font-bold text-foreground font-sans">Debts & Borrowings</h2>
          <p className="text-[14px] text-secondary font-sans">A unified view of what you owe and what is owed to you.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto font-sans">
          {/* Search query input */}
          <div className="relative w-full sm:w-64 font-sans">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-60 size-4" />
            <input
              type="text"
              placeholder="Search debts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground font-sans font-medium"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial">
              <DropdownMenu
                trigger={
                  <button className="bg-card border border-border px-4 py-2 rounded-lg font-bold text-[14px] flex items-center justify-center gap-1.5 hover:bg-muted/60 transition-colors cursor-pointer text-secondary w-full">
                    <Icons.Sliders className="size-4" />
                    Filter: {filterStatus === "PENDING" ? "Active" : filterStatus === "COMPLETED" ? "Settled" : "All"}
                  </button>
                }
                items={[
                  {
                    label: "Active Debts",
                    icon: <AlertCircle className="size-3.5 text-primary" />,
                    onClick: () => {
                      setFilterStatus("PENDING")
                      setLentPage(1)
                      setBorrowPage(1)
                    }
                  },
                  {
                    label: "Settled Debts",
                    icon: <Award className="size-3.5 text-[#10b981]" />,
                    onClick: () => {
                      setFilterStatus("COMPLETED")
                      setLentPage(1)
                      setBorrowPage(1)
                    }
                  },
                  {
                    label: "Show All",
                    icon: <Bookmark className="size-3.5" />,
                    onClick: () => {
                      setFilterStatus("")
                      setLentPage(1)
                      setBorrowPage(1)
                    }
                  }
                ]}
              />
            </div>
            <button className="flex-1 sm:flex-initial bg-card border border-border px-4 py-2 rounded-lg font-bold text-[14px] flex items-center justify-center gap-1.5 hover:bg-muted/60 transition-colors cursor-pointer text-secondary">
              <Icons.Download className="size-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Net Position Summary Section */}
      <div className="grid grid-cols-12 gap-6 font-sans">
        {/* Net Position Card */}
        <div className="col-span-12 lg:col-span-8 bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col md:flex-row gap-6 items-center relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="flex-1 space-y-4 z-10 text-left">
            <p className="text-[12px] font-bold text-secondary uppercase tracking-wider font-sans">Net Position</p>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-[36px] font-bold mt-1 font-sans", netPosition >= 0 ? "text-primary" : "text-[#a43a3a]")}>
                {netPosition >= 0 ? "+" : ""}{formatMoney(netPosition)}
              </span>
              <span className={cn(
                "px-2 py-0.5 text-[11px] font-bold rounded-full font-sans",
                netPosition >= 0 ? "bg-primary/10 text-primary" : "bg-[#a43a3a]/10 text-[#a43a3a]"
              )}>
                {netPosition >= 0 ? "Positive" : "Negative"}
              </span>
            </div>
            <p className="text-[13px] text-secondary font-sans">
              {netPosition >= 0 
                ? `You have ${formatMoney(Math.abs(netPosition))} more in assets being returned to you than outstanding debts.`
                : `You owe others ${formatMoney(Math.abs(netPosition))} more than what is being returned to you.`}
            </p>
            <div className="pt-2 flex gap-8 font-sans">
              <div>
                <p className="text-[11px] text-secondary uppercase tracking-wider font-semibold font-sans font-sans">Lent Out</p>
                <p className="text-[20px] text-primary font-bold font-sans">{formatMoney(totalLent)}</p>
              </div>
              <div className="w-[1px] bg-border h-10 self-center font-sans"></div>
              <div>
                <p className="text-[11px] text-secondary uppercase tracking-wider font-semibold font-sans font-sans font-sans font-sans">Total Debt</p>
                <p className="text-[20px] text-[#a43a3a] font-bold font-sans">{formatMoney(totalBorrowed)}</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 h-40 rounded-xl overflow-hidden relative border border-border/60">
            <img 
              className="w-full h-full object-cover font-sans" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC80Mx_bJbONrvawwtZhONsaqqt9PDO7_g1w6Izety8je2IPR6-h5hAEryVxsYRz49C8uYZe8goc7oSCgfxwMV5s6BU8wRKm70VdRQNEZziglVzKEGmEz7kDL8j-kBilAh5bNo0orkl0NrNBZgzykcu0hi4-RG3jWZoBirOtrvD360OYxm7eRgmZRMyf8v0RZHEpxDMS5LSQtA-LoP8vyhTQM6ez8onGqILESzrfWpq4V6mJL_dXkhN"
              alt="Analytics Chart" 
            />
          </div>
        </div>

        {/* Quick Stats Mini-Card */}
        <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col justify-center text-left font-sans">
            <div className="flex justify-between items-center mb-1">
              <TrendingUp className="size-5 text-primary" />
              <span className="text-[12px] font-bold text-primary font-sans">+12% vs last month</span>
            </div>
            <p className="text-[12px] font-bold text-secondary uppercase tracking-wider font-sans">Collection Rate</p>
            <p className="text-[24px] text-foreground font-bold font-sans">{collectionRate}%</p>
          </div>
          <div className="bg-[#a43a3a]/5 border border-[#a43a3a]/25 rounded-xl p-6 flex flex-col justify-center text-left font-sans">
            <div className="flex justify-between items-center mb-1">
              <AlertCircle className="size-5 text-[#a43a3a]" />
              <span className="text-[12px] font-bold text-[#a43a3a] font-sans">{paymentsDueCount} Payments due</span>
            </div>
            <p className="text-[12px] font-bold text-secondary uppercase tracking-wider font-sans">Next Due Date</p>
            <p className="text-[24px] text-foreground font-bold font-sans">{nextDueDateStr}</p>
          </div>
        </div>
      </div>

      {/* Mobile Tab Toggle for Lent/Borrow */}
      <div className="xl:hidden flex p-1 bg-muted rounded-xl border border-border mb-4">
        <button
          onClick={() => setActiveTab("LENT")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5",
            activeTab === "LENT"
              ? "bg-card text-primary shadow-sm"
              : "text-secondary hover:text-foreground"
          )}
        >
          <Icons.Handshake className="size-4" />
          Lent (They owe me)
        </button>
        <button
          onClick={() => setActiveTab("BORROW")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5",
            activeTab === "BORROW"
              ? "bg-card text-[#a43a3a] shadow-sm"
              : "text-secondary hover:text-foreground"
          )}
        >
          <Icons.Receipt className="size-4" />
          Borrowed (I owe them)
        </button>
      </div>

      {/* Main Lists Section */}
      <div className="flex flex-col xl:flex-row gap-6 mt-8 font-sans">
        
        {/* Lent List (They owe me) */}
        <div className={cn("flex-1 space-y-4", activeTab !== "LENT" && "hidden xl:block")}>
          <div className="flex items-center justify-between font-sans font-sans">
            <h3 className="text-[20px] font-bold text-foreground flex items-center gap-2 font-sans font-sans">
              <Icons.Handshake className="size-5 text-primary" />
              Lent (They owe me)
            </h3>
            <span className="bg-muted px-3 py-1 rounded-full font-bold text-[12px] text-secondary font-sans">
              {lentList.length} Entries
            </span>
          </div>

          <div className="space-y-4">

            {/* Add Lent Ghost Placeholder (Top placement for better UX) */}
            <button
              onClick={() => {
                setActiveTab("LENT")
                handleOpenCreate()
              }}
              className="w-full py-5 border-2 border-dashed border-border hover:border-primary rounded-xl flex flex-col items-center justify-center text-secondary hover:text-primary transition-all group cursor-pointer bg-card font-sans mb-4"
            >
              <Icons.PlusCircle className="size-6 mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-[13px]">Add someone who owes you</span>
            </button>

            {paginatedLentList.map((debt) => {
              const paidAmount = Number(debt.totalAmount) - Number(debt.remainingAmount);
              const progressPct = Number(debt.totalAmount) > 0 ? Math.round((paidAmount / Number(debt.totalAmount)) * 100) : 0;
              const initials = debt.partyName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              
              return (
                <div key={debt.id} className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border/80 hover:border-primary/50 transition-colors group text-left relative font-sans">
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                    <DropdownMenu
                      trigger={
                        <button className="p-1.5 rounded-full hover:bg-black/5 text-secondary cursor-pointer outline-none border-none bg-transparent flex items-center justify-center">
                          <MoreVertical className="size-4" />
                        </button>
                      }
                      items={[
                        {
                          label: "Edit Debt",
                          icon: <Edit2 className="size-3.5" />,
                          onClick: () => handleOpenEdit(debt),
                        },
                        {
                          label: "Add Repayment",
                          icon: <DollarSign className="size-3.5" />,
                          onClick: () => handleOpenRepayments(debt),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="size-3.5" />,
                          onClick: () => handleOpenDelete(debt),
                          isDestructive: true,
                        },
                      ]}
                    />
                  </div>

                  <div className="flex justify-between items-start mb-4 pr-8 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[15px]">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-[17px] text-foreground leading-snug">{debt.partyName}</h4>
                        <p className="text-[12px] text-secondary leading-tight mt-0.5">
                          Lent on: {debt.debtDate ? format(new Date(debt.debtDate), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy")}
                        </p>
                        {debt.note && (
                          <p className="text-[12px] text-primary/80 leading-tight mt-1 flex items-center gap-1 truncate max-w-[200px]">
                            <Info className="size-3 flex-shrink-0" />
                            {debt.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-bold text-primary leading-snug">
                        {formatMoney(Math.max(0, Number(debt.remainingAmount)))}
                      </p>
                      <p className="text-[12px] text-secondary mt-0.5 font-sans font-medium">Original: {formatMoney(debt.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 font-sans font-sans font-sans font-sans">
                    <div className="flex justify-between text-[12px] font-medium text-secondary font-sans">
                      <span>Repayment Progress</span>
                      <span className="text-primary font-bold">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center pt-4 border-t border-border/30 font-sans font-sans font-sans font-sans font-sans">
                    <div className="flex gap-4">
                      {debt.dueDate && (
                        <div className="flex items-center gap-1 text-secondary text-[12px]">
                          <Calendar className="size-3.5" />
                          <span>Due: {format(new Date(debt.dueDate), "dd MMM yyyy")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-secondary text-[12px]">
                        <Icons.Percent className="size-3.5" />
                        <span>0% Interest</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {(debt.status === "COMPLETED" || Number(debt.remainingAmount) <= 0) ? (
                        <Badge variant="success">Settled</Badge>
                      ) : (
                        <>
                          {debt.phoneNumber && (
                            <button 
                              onClick={() => {
                                const msg = generateDebtReminderMessage({
                                  partyName: debt.partyName,
                                  type: debt.type,
                                  amount: Number(debt.totalAmount),
                                  remainingAmount: Number(debt.remainingAmount),
                                  dueDate: debt.dueDate,
                                  senderName: user?.name,
                                })
                                const url = generateWhatsAppLink({
                                  phone: debt.phoneNumber || "",
                                  message: msg,
                                })
                                openWhatsApp(url)
                              }}
                              className="text-primary font-bold text-[13px] hover:underline cursor-pointer border-none bg-transparent"
                            >
                              Remind
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenRepayments(debt)}
                            className="text-primary font-bold text-[13px] hover:underline cursor-pointer border-none bg-transparent font-sans"
                          >
                            Settle Up
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination for Lent list */}
            {totalLentPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 bg-card border border-border rounded-xl p-4 font-sans select-none">
                <span className="text-[13px] text-secondary font-medium">
                  Showing {Math.min(lentList.length, (clampedLentPage - 1) * DEBTS_PER_PAGE + 1)}–{Math.min(lentList.length, clampedLentPage * DEBTS_PER_PAGE)} of {lentList.length}
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setLentPage(prev => Math.max(1, prev - 1))}
                    disabled={clampedLentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-40 hover:bg-muted/60 transition-colors cursor-pointer bg-card flex-1 sm:flex-none"
                  >
                    Previous
                  </button>
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: totalLentPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setLentPage(p)}
                        className={`size-8 rounded-lg text-[13px] font-bold transition-all cursor-pointer border-none flex items-center justify-center ${
                          clampedLentPage === p ? "bg-primary text-white" : "bg-muted text-secondary hover:bg-muted/80"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <span className="text-[13px] text-secondary font-bold sm:hidden px-2">
                    {clampedLentPage} / {totalLentPages}
                  </span>
                  <button
                    onClick={() => setLentPage(prev => Math.min(totalLentPages, prev + 1))}
                    disabled={clampedLentPage === totalLentPages}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-40 hover:bg-muted/60 transition-colors cursor-pointer bg-card flex-1 sm:flex-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Borrowed List (I owe them) */}
        <div className={cn("flex-1 space-y-4", activeTab !== "BORROW" && "hidden xl:block")}>
          <div className="flex items-center justify-between font-sans">
            <h3 className="text-[20px] font-bold text-foreground flex items-center gap-2">
              <Icons.Receipt className="size-5 text-[#a43a3a]" />
              Borrowed (I owe them)
            </h3>
            <span className="bg-muted px-3 py-1 rounded-full font-bold text-[12px] text-secondary font-sans">
              {borrowList.length} Entries
            </span>
          </div>

          <div className="space-y-4">

            {/* Add Borrow Ghost Placeholder (Top placement for better UX) */}
            <button
              onClick={() => {
                setActiveTab("BORROW")
                handleOpenCreate()
              }}
              className="w-full py-5 border-2 border-dashed border-border hover:border-danger rounded-xl flex flex-col items-center justify-center text-secondary hover:text-danger transition-all group cursor-pointer bg-card font-sans mb-4"
            >
              <Icons.PlusCircle className="size-6 mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-[13px]">Add someone you owe</span>
            </button>

            {paginatedBorrowList.map((debt) => {
              const paidAmount = Number(debt.totalAmount) - Number(debt.remainingAmount);
              const progressPct = Number(debt.totalAmount) > 0 ? Math.round((paidAmount / Number(debt.totalAmount)) * 100) : 0;
              const initials = debt.partyName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const isPending = debt.status === 'PENDING';
              
              return (
                <div key={debt.id} className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border/80 hover:border-danger/50 transition-colors group text-left relative font-sans">
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                    <DropdownMenu
                      trigger={
                        <button className="p-1.5 rounded-full hover:bg-black/5 text-secondary cursor-pointer outline-none border-none bg-transparent flex items-center justify-center">
                          <MoreVertical className="size-4" />
                        </button>
                      }
                      items={[
                        {
                          label: "Edit Debt",
                          icon: <Edit2 className="size-3.5" />,
                          onClick: () => handleOpenEdit(debt),
                        },
                        {
                          label: "Record Repayment",
                          icon: <DollarSign className="size-3.5" />,
                          onClick: () => handleOpenRepayments(debt),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="size-3.5" />,
                          onClick: () => handleOpenDelete(debt),
                          isDestructive: true,
                        },
                      ]}
                    />
                  </div>

                  <div className="flex justify-between items-start mb-4 pr-8 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#a43a3a]/10 flex items-center justify-center font-bold text-[#a43a3a] text-[15px]">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-[17px] text-foreground leading-snug">{debt.partyName}</h4>
                        <p className="text-[12px] text-secondary leading-tight mt-0.5">
                          Borrowed on: {debt.debtDate ? format(new Date(debt.debtDate), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy")}
                        </p>
                        {debt.note && (
                          <p className="text-[12px] text-[#a43a3a]/80 leading-tight mt-1 flex items-center gap-1 truncate max-w-[200px]">
                            <Info className="size-3 flex-shrink-0" />
                            {debt.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-bold text-[#a43a3a] leading-snug">
                        {formatMoney(Math.max(0, Number(debt.remainingAmount)))}
                      </p>
                      <p className="text-[12px] text-secondary mt-0.5 font-sans font-medium">Total: {formatMoney(debt.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 font-sans font-sans">
                    <div className="flex justify-between text-[12px] font-medium text-secondary">
                      <span>Amount Paid Off</span>
                      <span className="text-[#a43a3a] font-bold">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-danger/20 rounded-full overflow-hidden">
                      <div className="h-full bg-[#a43a3a] transition-all" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center pt-4 border-t border-border/30">
                    <div className="flex gap-4">
                      {debt.dueDate && (
                        <div className="flex items-center gap-1 text-secondary text-[12px]">
                          <Calendar className="size-3.5" />
                          <span>Due: {format(new Date(debt.dueDate), "dd MMM yyyy")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-secondary text-[12px] font-sans font-sans">
                        <Icons.Percent className="size-3.5" />
                        <span>8.5% APR</span>
                      </div>
                    </div>
                    {(debt.status === "COMPLETED" || Number(debt.remainingAmount) <= 0) ? (
                      <Badge variant="success">Settled</Badge>
                    ) : (
                      <button 
                        onClick={() => handleOpenRepayments(debt)}
                        className="bg-[#0b1c30] text-white px-4 py-1.5 rounded-lg font-bold text-[13px] hover:bg-black transition-colors cursor-pointer border-none font-sans font-sans font-sans"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination for Borrow list */}
            {totalBorrowPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 bg-card border border-border rounded-xl p-4 font-sans select-none">
                <span className="text-[13px] text-secondary font-medium">
                  Showing {Math.min(borrowList.length, (clampedBorrowPage - 1) * DEBTS_PER_PAGE + 1)}–{Math.min(borrowList.length, clampedBorrowPage * DEBTS_PER_PAGE)} of {borrowList.length}
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setBorrowPage(prev => Math.max(1, prev - 1))}
                    disabled={clampedBorrowPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-40 hover:bg-muted/60 transition-colors cursor-pointer bg-card flex-1 sm:flex-none"
                  >
                    Previous
                  </button>
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: totalBorrowPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setBorrowPage(p)}
                        className={`size-8 rounded-lg text-[13px] font-bold transition-all cursor-pointer border-none flex items-center justify-center ${
                          clampedBorrowPage === p ? "bg-danger text-white" : "bg-muted text-secondary hover:bg-muted/80"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <span className="text-[13px] text-secondary font-bold sm:hidden px-2">
                    {clampedBorrowPage} / {totalBorrowPages}
                  </span>
                  <button
                    onClick={() => setBorrowPage(prev => Math.min(totalBorrowPages, prev + 1))}
                    disabled={clampedBorrowPage === totalBorrowPages}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-40 hover:bg-muted/60 transition-colors cursor-pointer bg-card flex-1 sm:flex-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Insights & Strategies Section */}
      <section className="mt-12 select-none text-left">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Strategy Card */}
          <div className="md:w-1/3 bg-[#0b1c30] text-white rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative shadow-sm font-sans">
            <div className="z-10 text-left font-sans">
              <h4 className="text-[20px] font-bold mb-4 font-sans">Growth Strategy</h4>
              <p className="text-[14px] text-slate-300 leading-relaxed mb-6 font-sans">
                {smartStrategyText}
              </p>
              <button className="bg-primary text-white border-none px-6 py-2.5 rounded-full font-bold text-[13px] hover:brightness-110 transition-all cursor-pointer">
                Enable Auto-Snowball
              </button>
            </div>
            
            {/* Background design icon */}
            <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
              <Icons.Sparkles className="size-40 text-primary" />
            </div>
          </div>

          {/* Repayment Timeline Card */}
          <div className="md:w-2/3 bg-card border border-border shadow-sm rounded-2xl p-8 text-left font-sans">
            <h4 className="text-[20px] font-bold text-foreground mb-6 font-sans">Repayment Timeline</h4>
            <div className="h-48 w-full relative font-sans">
              {/* Dynamic visual chart bars */}
              <div className="absolute inset-0 flex items-end gap-3 px-4 font-sans">
                {timelineData.map((t, idx) => {
                  const isZero = t.amount === 0;
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "flex-1 rounded-t-md relative group cursor-pointer transition-all duration-300",
                        isZero ? "bg-slate-200/50 dark:bg-slate-800/30" : idx % 3 === 0 ? "bg-primary" : idx % 3 === 1 ? "bg-info/70" : "bg-success/70"
                      )}
                      style={{ height: `${t.heightPct}%` }}
                    >
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-md"></div>
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 font-bold text-[11px] opacity-0 group-hover:opacity-100 whitespace-nowrap bg-[#0b1c30] text-white px-2 py-0.5 rounded shadow-sm font-sans z-30">
                        {t.label}: {formatMoney(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between mt-4 px-4 border-t border-border/40 pt-2 text-[10px] font-bold text-secondary font-sans">
              {timelineData.map((t, idx) => (
                <span key={idx}>{t.label}</span>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-secondary italic font-sans">
              Estimated debt-free date: <span className="font-bold text-foreground">{maxTimelineLabel}</span> (excluding lending collections).
            </p>
          </div>

        </div>
      </section>

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

          <CustomInput
            label="Phone Number (Optional)"
            placeholder="e.g. 9876543210"
            value={debtPhone}
            onChange={(e) => setDebtPhone(e.target.value)}
          />

          <CurrencyInput
            label="Original Amount"
            placeholder="0.00"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
          />

          <CustomSelect
            label="Associated Account (Bank / Card / Cash)"
            value={debtAccountId}
            onChange={setDebtAccountId}
            options={accounts
              .filter((a) => {
                if (a.isArchived) return false;
                // BORROW = receiving money, credit card cannot receive money
                if (activeTab === "BORROW" && a.type === "CREDIT_CARD") return false;
                return true;
              })
              .map((a) => ({ value: a.id, label: a.name }))}
          />

          <CustomDatePicker
            label={activeTab === "BORROW" ? "Borrow Date" : "Lent Date"}
            value={debtDate}
            onChange={setDebtDate}
          />

          <CustomDatePicker
            label="Due Date (Optional)"
            value={debtDueDate}
            onChange={setDebtDueDate}
          />

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

          <CustomInput
            label="Phone Number (Optional)"
            placeholder="e.g. 9876543210"
            value={debtPhone}
            onChange={(e) => setDebtPhone(e.target.value)}
          />

          <CurrencyInput
            label="Total Amount"
            placeholder="0.00"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
          />

          <CustomSelect
            label="Associated Account (Bank / Card / Cash)"
            value={debtAccountId}
            onChange={setDebtAccountId}
            options={accounts
              .filter((a) => {
                if (a.isArchived) return false;
                // BORROW = receiving money, credit card cannot receive money
                if (selectedDebt?.type === "BORROW" && a.type === "CREDIT_CARD") return false;
                return true;
              })
              .map((a) => ({ value: a.id, label: a.name }))}
          />

          <CustomDatePicker
            label={selectedDebt?.type === "BORROW" ? "Borrow Date" : "Lent Date"}
            value={debtDate}
            onChange={setDebtDate}
          />

          <CustomDatePicker
            label="Due Date (Optional)"
            value={debtDueDate}
            onChange={setDebtDueDate}
          />

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
              <CustomButton
                variant="primary"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const allowed = accounts.filter((a: any) => {
                    if (a.isArchived) return false;
                    if (selectedDebt?.type === "BORROW") {
                      // Borrow repayment = paying money back, allow CASH, BANK, and CREDIT_CARD
                      return a.type === "CASH" || a.type === "BANK" || a.type === "CREDIT_CARD";
                    } else {
                      // Lent repayment = receiving money back, only CASH and BANK
                      return a.type === "CASH" || a.type === "BANK";
                    }
                  });
                  setRepayAccountId(allowed.find((a: any) => a.isDefault)?.id || allowed[0]?.id || "");
                  setIsAddRepaymentOpen(true);
                }}
              >
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
              {repayments.map((repay) => {
                const acc = accounts.find((a: any) => a.id === repay.accountId);
                return (
                  <div key={repay.id} className="bg-card border border-border rounded-[10px] p-3 flex justify-between items-center shadow-2xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{formatMoney(repay.amount)}</span>
                      <span className="text-2xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span>{format(new Date(repay.repaymentDate), "dd MMM yyyy")}</span>
                        {acc && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="font-semibold text-primary">{acc.name}</span>
                          </>
                        )}
                      </span>
                    </div>
                    {repay.note && <span className="text-2xs text-muted-foreground italic max-w-[150px] truncate">{repay.note}</span>}
                  </div>
                );
              })}
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

          <CustomSelect
            label={selectedDebt?.type === "BORROW" ? "Pay From Account" : "Receive into Account"}
            value={repayAccountId}
            onChange={setRepayAccountId}
            options={accounts
              .filter((a: any) => {
                if (a.isArchived) return false;
                if (selectedDebt?.type === "BORROW") {
                  // Borrow repayment = paying money back, allow CASH, BANK, and CREDIT_CARD
                  return a.type === "CASH" || a.type === "BANK" || a.type === "CREDIT_CARD";
                } else {
                  // Lent repayment = receiving money back, only CASH and BANK
                  return a.type === "CASH" || a.type === "BANK";
                }
              })
              .map((a: any) => ({ value: a.id, label: a.name }))}
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

      {/* Repayment WhatsApp Confirmation Dialog */}
      <CustomDialog
        isOpen={isRepaymentConfirmOpen}
        onClose={() => setIsRepaymentConfirmOpen(false)}
        title="Repayment Recorded"
        description="Repayment recorded successfully. Would you like to send a WhatsApp confirmation?"
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsRepaymentConfirmOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              disabled={!selectedDebt?.phoneNumber}
              onClick={() => {
                if (selectedDebt?.phoneNumber) {
                  const msg = generateRepaymentReminderMessage({
                    partyName: selectedDebt.partyName,
                    type: selectedDebt.type,
                    amountPaid: lastRepaymentAmount,
                    remainingAmount: selectedDebt.remainingAmount,
                    senderName: user?.name,
                  })
                  const url = generateWhatsAppLink({
                    phone: selectedDebt.phoneNumber || "",
                    message: msg,
                  })
                  openWhatsApp(url)
                }
                setIsRepaymentConfirmOpen(false)
              }}
            >
              Send WhatsApp
            </CustomButton>
          </>
        }
      >
        {!selectedDebt?.phoneNumber && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/60 rounded-[10px] mt-2 text-amber-800 text-xs">
            <AlertCircle className="size-4 text-amber-600 flex-shrink-0" />
            <span>No phone number available.</span>
          </div>
        )}
      </CustomDialog>

      {/* Debt Creation WhatsApp Confirmation Dialog */}
      <CustomDialog
        isOpen={isDebtConfirmOpen}
        onClose={() => setIsDebtConfirmOpen(false)}
        title="Debt Recorded"
        description="Debt recorded successfully. Would you like to send a WhatsApp reminder?"
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsDebtConfirmOpen(false)}>
              Later
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              disabled={!createdDebt?.phoneNumber}
              onClick={() => {
                if (createdDebt?.phoneNumber) {
                  const msg = generateDebtReminderMessage({
                    partyName: createdDebt.partyName,
                    type: createdDebt.type,
                    amount: Number(createdDebt.totalAmount),
                    remainingAmount: Number(createdDebt.remainingAmount),
                    dueDate: createdDebt.dueDate,
                    senderName: user?.name,
                  })
                  const url = generateWhatsAppLink({
                    phone: createdDebt.phoneNumber || "",
                    message: msg,
                  })
                  openWhatsApp(url)
                }
                setIsDebtConfirmOpen(false)
              }}
            >
              Send WhatsApp
            </CustomButton>
          </>
        }
      >
        {!createdDebt?.phoneNumber && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/60 rounded-[10px] mt-2 text-amber-800 text-xs">
            <AlertCircle className="size-4 text-amber-600 flex-shrink-0" />
            <span>No phone number available.</span>
          </div>
        )}
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
