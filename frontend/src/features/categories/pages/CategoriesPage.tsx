import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Plus, Search, MoreVertical, Edit2, Trash2, FolderOpen, AlertCircle, Info, ChevronDown, ChevronUp, X } from "lucide-react"
import * as Icons from "lucide-react"
import { toast } from "sonner"

import {
  useCategoriesList,
  useCategoryIcons,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useCategories"
import { useTransactionsList } from "../../transactions/hooks/useTransactions"
import { useCurrency } from "../../../hooks/useCurrency"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { DropdownMenu } from "../../../components/ui/dropdown-menu"

const COLOR_PALETTE = [
  "#006c49", // Primary Emerald
  "#10b981", // Success Green
  "#0b1c30", // Slate Navy
  "#515f74", // Secondary Gray
  "#0891b2", // Cyan
  "#7c3aed", // Purple
  "#e11d48", // Rose
]

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [expensePage, setExpensePage] = useState(1)
  const [incomePage, setIncomePage] = useState(1)
  const [showAllHierarchy, setShowAllHierarchy] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState<any>(null)

  const [catName, setCatName] = useState("")
  const [catColor, setCatColor] = useState(COLOR_PALETTE[0])
  const [selectedIconId, setSelectedIconId] = useState("")
  const [showAllIcons, setShowAllIcons] = useState(false)
  const [iconSearchQuery, setIconSearchQuery] = useState("")
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(7)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setItemsPerPage(8)
      } else {
        setItemsPerPage(7)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const [pickerCoords, setPickerCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({ top: 0, left: 0, width: 0, openUp: false })

  const updatePickerCoords = (triggerEl: HTMLButtonElement) => {
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect()
      const dropdownHeight = 230
      const margin = 6
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < dropdownHeight + 20 && rect.top > dropdownHeight + 20

      setPickerCoords({
        top: openUp 
          ? rect.top + window.scrollY - dropdownHeight - margin 
          : rect.bottom + window.scrollY + margin,
        left: rect.left + window.scrollX,
        width: rect.width,
        openUp
      })
    }
  }

  const createIconDropdownRef = useRef<HTMLDivElement>(null)
  const editIconDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        (!createIconDropdownRef.current || !createIconDropdownRef.current.contains(e.target as Node)) &&
        (!editIconDropdownRef.current || !editIconDropdownRef.current.contains(e.target as Node))
      ) {
        setIsIconDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const { data: categories = [], isLoading, isError, refetch } = useCategoriesList()
  const { data: icons = [] } = useCategoryIcons()
  const { data: transactions = [] } = useTransactionsList()
  const { format: formatMoney } = useCurrency()

  // Deduplicate icons by iconKey to show each visual icon exactly once
  const uniqueIcons: typeof icons = []
  const seenKeys = new Set<string>()
  for (const icon of icons) {
    if (!seenKeys.has(icon.iconKey)) {
      seenKeys.add(icon.iconKey)
      uniqueIcons.push(icon)
    }
  }

  const filteredIcons = uniqueIcons.filter(
    (icon) =>
      icon.displayName.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
      icon.iconKey.toLowerCase().includes(iconSearchQuery.toLowerCase())
  )

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenCreate = (type?: "EXPENSE" | "INCOME") => {
    const selectedType = type || activeTab
    setActiveTab(selectedType)
    setCatName("")
    setCatColor(COLOR_PALETTE[0])
    setShowAllIcons(false)

    // Auto-select first icon that matches selected type
    const tabIcons = icons.filter((i) => i.type === selectedType)
    setSelectedIconId(tabIcons[0]?.id || "")
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (category: any) => {
    setSelectedCategory(category)
    setCatName(category.name)
    setCatColor(category.color || COLOR_PALETTE[0])
    setSelectedIconId(category.categoryIconId)
    setShowAllIcons(false)
    setIsEditOpen(true)
  }

  const handleOpenDelete = (category: any) => {
    setSelectedCategory(category)
    setIsDeleteOpen(true)
  }

  const handleCreate = () => {
    if (!catName.trim()) {
      toast.error("Category name is required.")
      return
    }
    if (!selectedIconId) {
      toast.error("Please select an icon.")
      return
    }
    createMutation.mutate(
      {
        name: catName.trim(),
        type: activeTab,
        categoryIconId: selectedIconId,
        color: catColor,
      },
      {
        onSuccess: () => setIsCreateOpen(false),
      }
    )
  }

  const handleEdit = () => {
    if (!catName.trim()) {
      toast.error("Category name is required.")
      return
    }
    updateMutation.mutate(
      {
        id: selectedCategory.id,
        data: {
          name: catName.trim(),
          categoryIconId: selectedIconId,
          color: catColor,
        },
      },
      {
        onSuccess: () => setIsEditOpen(false),
      }
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(selectedCategory.id, {
      onSuccess: () => setIsDeleteOpen(false),
    })
  }

  // Dynamic Lucide Icon Resolver
  const renderIcon = (iconName: string, color?: string) => {
    const LucideIcon = (Icons as any)[iconName] || Icons.FolderOpen
    return <LucideIcon className="size-5" style={{ color }} />
  }

  if (isLoading) {
    return <CategoriesSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-danger/10 bg-danger/5 rounded-[16px] max-w-2xl mx-auto mt-12">
        <AlertCircle className="size-12 text-danger mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-1">Failed to fetch Categories</h2>
        <p className="text-sm text-muted-foreground mb-6">There was an error communicating with the backend API.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry
        </CustomButton>
      </div>
    )
  }

  // Calculate spent map
  const categorySpentMap: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.categoryId) {
      categorySpentMap[t.categoryId] = (categorySpentMap[t.categoryId] || 0) + Number(t.amount);
    }
  });

  const expenseCategories = filteredCategories
    .filter(c => c.type === 'EXPENSE')
    .sort((a, b) => (categorySpentMap[b.id] || 0) - (categorySpentMap[a.id] || 0));

  const incomeCategories = filteredCategories
    .filter(c => c.type === 'INCOME')
    .sort((a, b) => (categorySpentMap[b.id] || 0) - (categorySpentMap[a.id] || 0));

  const totalExpensePages = Math.ceil(expenseCategories.length / itemsPerPage) || 1;
  const clampedExpensePage = Math.min(expensePage, totalExpensePages);
  const paginatedExpenseCategories = expenseCategories.slice((clampedExpensePage - 1) * itemsPerPage, clampedExpensePage * itemsPerPage);

  const totalIncomePages = Math.ceil(incomeCategories.length / itemsPerPage) || 1;
  const clampedIncomePage = Math.min(incomePage, totalIncomePages);
  const paginatedIncomeCategories = incomeCategories.slice((clampedIncomePage - 1) * itemsPerPage, clampedIncomePage * itemsPerPage);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTxs = transactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthTxs = transactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  // Calculate deep analysis values
  const totalExpenseSpent = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0) || 1;
  
  const housingSpent = transactions.filter(t => {
    if (t.type !== 'EXPENSE' || !t.categoryId) return false;
    const cat = categories.find(c => c.id === t.categoryId);
    const name = (cat?.name || "").toLowerCase();
    return name.includes('housing') || name.includes('rent') || name.includes('utilities') || name.includes('home');
  }).reduce((sum, t) => sum + Number(t.amount), 0);
  const housingPct = Math.round((housingSpent / totalExpenseSpent) * 100);

  const lifestyleSpent = transactions.filter(t => {
    if (t.type !== 'EXPENSE' || !t.categoryId) return false;
    const cat = categories.find(c => c.id === t.categoryId);
    const name = (cat?.name || "").toLowerCase();
    return name.includes('food') || name.includes('dining') || name.includes('entertain') || name.includes('lifestyle') || name.includes('shop');
  }).reduce((sum, t) => sum + Number(t.amount), 0);
  const lifestylePct = Math.round((lifestyleSpent / totalExpenseSpent) * 100);

  let smartInsightText = "Consolidating similar small subscriptions into one family plan could save up to ₹1,200/mo.";
  if (housingPct > 40) {
    smartInsightText = "Your housing expenses represent a significant portion of your total budget. Consider evaluating utility packages to optimize.";
  } else if (lifestylePct > 30) {
    smartInsightText = "Lifestyle and dining expenses are higher than recommended. Try planning meals or setting weekly caps.";
  }

  // Calculate category monthly trend
  const getCategoryTrend = (catId: string) => {
    const thisMonthSum = thisMonthTxs.filter(t => t.categoryId === catId).reduce((sum, t) => sum + Number(t.amount), 0);
    const lastMonthSum = lastMonthTxs.filter(t => t.categoryId === catId).reduce((sum, t) => sum + Number(t.amount), 0);
    if (lastMonthSum > 0) {
      const change = Math.round(((thisMonthSum - lastMonthSum) / lastMonthSum) * 100);
      return {
        label: change >= 0 ? `+${change}%` : `${change}%`,
        style: change >= 0 ? "bg-[#a43a3a]/10 text-[#a43a3a]" : "bg-primary/10 text-primary"
      };
    }
    return { label: "0%", style: "bg-secondary/15 text-secondary" };
  };

  return (
    <div className="flex flex-col gap-8 pb-12 select-none text-left font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5 font-sans">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-[40px] text-foreground">Categories Management</h1>
          <p className="text-[14px] text-secondary">Organize and analyze your spending and income streams.</p>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Hierarchy & Deep Analysis */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          


          {/* Deep Category Analysis */}
          <div className="bg-card border border-border shadow-sm rounded-xl p-6 overflow-hidden relative min-h-[300px]">
            <h3 className="text-[20px] font-bold text-foreground mb-1">Deep Analysis</h3>
            <p className="text-[13px] text-secondary mb-6">Visualizing categorical growth trends over the last quarter.</p>
            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[14px] font-semibold text-foreground">Housing Efficiency</span>
                  <span className="text-[14px] font-bold text-primary">{housingPct}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${housingPct || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[14px] font-semibold text-foreground">Lifestyle Spend</span>
                  <span className="text-[14px] font-bold text-[#a43a3a]">{lifestylePct}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-[#a43a3a] h-full rounded-full" style={{ width: `${lifestylePct || 0}%` }}></div>
                </div>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 font-sans">
                <div className="flex items-start gap-3">
                  <Icons.Sparkles className="size-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-bold text-foreground">Smart Insight</p>
                    <p className="text-[13px] text-secondary leading-relaxed mt-0.5">{smartInsightText}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background design icon */}
            <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
              <Icons.BarChart4 className="size-48 text-primary" />
            </div>
          </div>
        </section>

        {/* Right Column: Grid Lists */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Search box card */}
          <div className="bg-card border border-border shadow-sm rounded-xl p-4 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-60 size-4" />
              <input
                type="text"
                placeholder="Search categories by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground font-sans font-medium"
              />
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-[20px] font-bold text-foreground">Expense Categories</h3>
              <a className="text-primary font-bold text-[14px] hover:underline cursor-pointer font-sans">Manage All</a>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Add Expense Placeholder Card */}
              <button 
                onClick={() => handleOpenCreate("EXPENSE")}
                className="border-2 border-dashed border-border/80 hover:border-primary rounded-xl p-3.5 sm:p-5 flex flex-col items-center justify-center gap-2 text-secondary hover:text-primary transition-all group h-[168px] cursor-pointer bg-card"
              >
                <Icons.PlusCircle className="size-8 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[13px] sm:text-[14px]">Add Expense</span>
              </button>

              {paginatedExpenseCategories.map((cat) => {
                const iconObj = icons.find((i) => i.id === cat.categoryIconId)
                const iconName = iconObj?.iconKey || "FolderOpen"
                const spentValue = categorySpentMap[cat.id] || 0
                const trend = getCategoryTrend(cat.id)

                return (
                  <div key={cat.id} className="bg-card border border-border rounded-xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between h-[168px] relative text-left font-sans">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        {renderIcon(iconName, cat.color)}
                      </div>
                      
                      <DropdownMenu
                        trigger={
                          <button
                            type="button"
                            className="p-1.5 rounded-full hover:bg-black/5 text-secondary transition-colors cursor-pointer outline-none border-none bg-transparent flex items-center justify-center"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        }
                        items={[
                          {
                            label: "Edit Category",
                            icon: <Edit2 className="size-3.5" />,
                            onClick: () => handleOpenEdit(cat),
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="size-3.5" />,
                            onClick: () => handleOpenDelete(cat),
                            isDestructive: true,
                          },
                        ]}
                      />
                    </div>
                    
                    <div className="mt-2">
                      <h4 className="text-[14px] sm:text-[17px] font-bold text-foreground mb-0.5 leading-tight line-clamp-1">{cat.name}</h4>
                      <p className="text-[10px] sm:text-[12px] text-secondary leading-snug line-clamp-1">Daily essentials & classifications</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40 font-sans">
                      <span className="text-[15px] sm:text-[20px] font-bold text-primary leading-none">{formatMoney(spentValue)}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] sm:text-[11px] font-bold", trend.style)}>{trend.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalExpensePages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 bg-card border border-border rounded-xl p-4 font-sans select-none gap-4 text-center sm:text-left">
                <span className="text-[13px] text-secondary font-medium">
                  Showing {Math.min(expenseCategories.length, (clampedExpensePage - 1) * itemsPerPage + 1)} to {Math.min(expenseCategories.length, clampedExpensePage * itemsPerPage)} of {expenseCategories.length} categories
                </span>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setExpensePage(prev => Math.max(1, prev - 1))}
                    disabled={clampedExpensePage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-50 hover:bg-muted/60 transition-colors cursor-pointer bg-card"
                  >
                    Previous
                  </button>
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: totalExpensePages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setExpensePage(p)}
                        className={cn(
                          "size-8 rounded-lg text-[13px] font-bold transition-all cursor-pointer border-none flex items-center justify-center",
                          clampedExpensePage === p ? "bg-primary text-white" : "bg-muted text-secondary hover:bg-muted/80"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setExpensePage(prev => Math.min(totalExpensePages, prev + 1))}
                    disabled={clampedExpensePage === totalExpensePages}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-50 hover:bg-muted/60 transition-colors cursor-pointer bg-card"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Income Categories */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-[20px] font-bold text-foreground">Income Categories</h3>
              <a className="text-primary font-bold text-[14px] hover:underline cursor-pointer font-sans font-medium">Manage All</a>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Add Income Placeholder Card */}
              <button 
                onClick={() => handleOpenCreate("INCOME")}
                className="border-2 border-dashed border-border/80 hover:border-primary rounded-xl p-3.5 sm:p-5 flex flex-col items-center justify-center gap-2 text-secondary hover:text-primary transition-all group h-[168px] cursor-pointer bg-card"
              >
                <Icons.PlusCircle className="size-8 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[13px] sm:text-[14px]">Add Income</span>
              </button>

              {paginatedIncomeCategories.map((cat) => {
                const iconObj = icons.find((i) => i.id === cat.categoryIconId)
                const iconName = iconObj?.iconKey || "FolderOpen"
                const incomeValue = categorySpentMap[cat.id] || 0

                return (
                  <div key={cat.id} className="bg-primary/5 border border-primary/20 hover:bg-primary/10 rounded-xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-[168px] relative text-left font-sans">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                        {renderIcon(iconName, cat.color)}
                      </div>
                      
                      <DropdownMenu
                        trigger={
                          <button
                            type="button"
                            className="p-1.5 rounded-full hover:bg-black/5 text-secondary transition-colors cursor-pointer outline-none border-none bg-transparent flex items-center justify-center"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        }
                        items={[
                          {
                            label: "Edit Category",
                            icon: <Edit2 className="size-3.5" />,
                            onClick: () => handleOpenEdit(cat),
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="size-3.5" />,
                            onClick: () => handleOpenDelete(cat),
                            isDestructive: true,
                          },
                        ]}
                      />
                    </div>
                    
                    <div className="mt-2">
                      <h4 className="text-[14px] sm:text-[17px] font-bold text-foreground mb-0.5 leading-tight line-clamp-1">{cat.name}</h4>
                      <p className="text-[10px] sm:text-[12px] text-secondary leading-snug line-clamp-1">Deposits & salary streams</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40 font-sans">
                      <span className="text-[15px] sm:text-[20px] font-bold text-primary leading-none">{formatMoney(incomeValue)}</span>
                      <Icons.TrendingUp className="size-5 text-primary" />
                    </div>
                  </div>
                );
              })}
            </div>

            {totalIncomePages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 bg-card border border-border rounded-xl p-4 font-sans select-none gap-4 text-center sm:text-left">
                <span className="text-[13px] text-secondary font-medium">
                  Showing {Math.min(incomeCategories.length, (clampedIncomePage - 1) * itemsPerPage + 1)} to {Math.min(incomeCategories.length, clampedIncomePage * itemsPerPage)} of {incomeCategories.length} categories
                </span>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setIncomePage(prev => Math.max(1, prev - 1))}
                    disabled={clampedIncomePage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-50 hover:bg-muted/60 transition-colors cursor-pointer bg-card"
                  >
                    Previous
                  </button>
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: totalIncomePages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setIncomePage(p)}
                        className={cn(
                          "size-8 rounded-lg text-[13px] font-bold transition-all cursor-pointer border-none flex items-center justify-center",
                          clampedIncomePage === p ? "bg-primary text-white" : "bg-[#eff4ff] text-secondary hover:bg-[#eff4ff]/80"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setIncomePage(prev => Math.min(totalIncomePages, prev + 1))}
                    disabled={clampedIncomePage === totalIncomePages}
                    className="px-3 py-1.5 rounded-lg border border-border text-[13px] font-bold text-secondary disabled:opacity-50 hover:bg-muted/60 transition-colors cursor-pointer bg-card"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visual Accent Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0b1c30] p-8 text-left text-white shadow-sm font-sans">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-md">
                <h3 className="text-[24px] font-bold text-white mb-2">Master Your Flow</h3>
                <p className="text-[13px] text-secondary opacity-80 leading-relaxed">Correctly categorizing your transactions is the first step toward high-fidelity financial planning. Use our auto-rule engine to save 4 hours a month.</p>
                <button className="mt-5 bg-primary text-white border-none px-6 py-2 rounded-full font-bold text-[13px] hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                  Set Automation Rules
                </button>
              </div>
              <div className="hidden md:flex w-36 h-36 border-4 border-primary/20 rounded-2xl items-center justify-center relative overflow-hidden flex-shrink-0">
                <Icons.Cpu className="size-16 text-white opacity-80" />
              </div>
            </div>
            
            {/* Decorative background gradient */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none font-sans"></div>
          </div>

        </section>
      </div>

      {/* Add Dialog (Section 71) */}
      <CustomDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Category"
        description="Create a custom category classifier for tracking transactions."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleCreate} isLoading={createMutation.isPending}>
              Create Category
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <CustomInput
            label="Category Name"
            placeholder="e.g. Health Supplements"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground select-none">Theme Color</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    catColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div ref={createIconDropdownRef} className="flex flex-col gap-2 relative w-full text-foreground select-none">
            <span className="text-[14px] font-semibold text-foreground select-none">Icon Representation</span>

            <button
              type="button"
              onClick={(e) => {
                updatePickerCoords(e.currentTarget)
                setIsIconDropdownOpen(!isIconDropdownOpen)
                setIconSearchQuery("")
              }}
              className="flex items-center justify-between w-full h-10 px-3.5 py-2 text-[15px] font-semibold bg-input text-foreground border border-border rounded-[12px] outline-none cursor-pointer hover:border-primary/40 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                {(() => {
                  const selectedIcon = icons.find((i) => i.id === selectedIconId)
                  return selectedIcon ? (
                    <>
                      <span className="flex items-center justify-center p-1 rounded-md" style={{ backgroundColor: `${catColor}15` }}>
                        {renderIcon(selectedIcon.iconKey, catColor)}
                      </span>
                      <span className="text-sm font-semibold">
                        {selectedIcon.displayName}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm font-medium">Select Icon</span>
                  )
                })()}
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>

            {isIconDropdownOpen && createPortal(
              <div
                ref={createIconDropdownRef}
                style={{
                  position: "absolute",
                  top: `${pickerCoords.top}px`,
                  left: `${pickerCoords.left}px`,
                  width: `${pickerCoords.width}px`,
                }}
                className={cn(
                  "z-[9999] p-3 bg-popover border border-border rounded-[16px] shadow-modal flex flex-col gap-2.5 animate-dropdown",
                  pickerCoords.openUp ? "origin-bottom" : "origin-top"
                )}
              >
                {/* Search Bar */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none select-none" />
                  <input
                    type="text"
                    placeholder="Search icons..."
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    className="h-8 w-full pl-8 pr-8 bg-input text-foreground border border-border rounded-[8px] text-xs outline-none focus:border-primary transition-colors font-sans font-medium"
                    autoFocus
                  />
                  {iconSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setIconSearchQuery("")}
                      className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-6 gap-2 overflow-y-auto max-h-[160px] pr-1">
                  {filteredIcons.length === 0 ? (
                    <div className="col-span-6 py-6 text-center text-xs text-muted-foreground font-medium">
                      No matching icons found.
                    </div>
                  ) : (
                    filteredIcons.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => {
                          setSelectedIconId(icon.id)
                          setIsIconDropdownOpen(false)
                        }}
                        className={cn(
                          "aspect-square rounded-[8px] border flex items-center justify-center bg-card text-foreground cursor-pointer hover:bg-muted transition-colors p-1.5",
                          selectedIconId === icon.id ? "border-primary bg-primary/5" : "border-border"
                        )}
                        title={icon.displayName}
                      >
                        {renderIcon(icon.iconKey, selectedIconId === icon.id ? catColor : "#94a3b8")}
                      </button>
                    ))
                  )}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </CustomDialog>

      {/* Edit Dialog */}
      <CustomDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Category"
        description="Update the name, icon, or color mapping of your category."
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
            label="Category Name"
            placeholder="e.g. Restaurants"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground select-none">Theme Color</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    catColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div ref={editIconDropdownRef} className="flex flex-col gap-2 relative w-full text-foreground select-none">
            <span className="text-[14px] font-semibold text-foreground select-none">Icon Representation</span>

            <button
              type="button"
              onClick={(e) => {
                updatePickerCoords(e.currentTarget)
                setIsIconDropdownOpen(!isIconDropdownOpen)
                setIconSearchQuery("")
              }}
              className="flex items-center justify-between w-full h-10 px-3.5 py-2 text-[15px] font-semibold bg-input text-foreground border border-border rounded-[12px] outline-none cursor-pointer hover:border-primary/40 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                {(() => {
                  const selectedIcon = icons.find((i) => i.id === selectedIconId)
                  return selectedIcon ? (
                    <>
                      <span className="flex items-center justify-center p-1 rounded-md" style={{ backgroundColor: `${catColor}15` }}>
                        {renderIcon(selectedIcon.iconKey, catColor)}
                      </span>
                      <span className="text-sm font-semibold">
                        {selectedIcon.displayName}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm font-medium">Select Icon</span>
                  )
                })()}
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>

            {isIconDropdownOpen && createPortal(
              <div
                ref={editIconDropdownRef}
                style={{
                  position: "absolute",
                  top: `${pickerCoords.top}px`,
                  left: `${pickerCoords.left}px`,
                  width: `${pickerCoords.width}px`,
                }}
                className={cn(
                  "z-[9999] p-3 bg-popover border border-border rounded-[16px] shadow-modal flex flex-col gap-2.5 animate-dropdown",
                  pickerCoords.openUp ? "origin-bottom" : "origin-top"
                )}
              >
                {/* Search Bar */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none select-none" />
                  <input
                    type="text"
                    placeholder="Search icons..."
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    className="h-8 w-full pl-8 pr-8 bg-input text-foreground border border-border rounded-[8px] text-xs outline-none focus:border-primary transition-colors font-sans font-medium"
                    autoFocus
                  />
                  {iconSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setIconSearchQuery("")}
                      className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-6 gap-2 overflow-y-auto max-h-[160px] pr-1">
                  {filteredIcons.length === 0 ? (
                    <div className="col-span-6 py-6 text-center text-xs text-muted-foreground font-medium">
                      No matching icons found.
                    </div>
                  ) : (
                    filteredIcons.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => {
                          setSelectedIconId(icon.id)
                          setIsIconDropdownOpen(false)
                        }}
                        className={cn(
                          "aspect-square rounded-[8px] border flex items-center justify-center bg-card text-foreground cursor-pointer hover:bg-muted transition-colors p-1.5",
                          selectedIconId === icon.id ? "border-primary bg-primary/5" : "border-border"
                        )}
                        title={icon.displayName}
                      >
                        {renderIcon(icon.iconKey, selectedIconId === icon.id ? catColor : "#94a3b8")}
                      </button>
                    ))
                  )}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </CustomDialog>

      {/* Delete confirmation (Section 71) */}
      <CustomDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Category?"
        description="Are you sure you want to remove this category? Existing transactions using this category will remain unchanged."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="danger" size="sm" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete Category
            </CustomButton>
          </>
        }
      >
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200/60 rounded-[10px] mt-2 text-amber-800">
          <Info className="size-5 flex-shrink-0" />
          <span className="text-xs leading-normal">
            This action cannot be undone. Make sure you don't require this specific category filter.
          </span>
        </div>
      </CustomDialog>

    </div>
  )

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }
}

function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse">
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div className="h-8 w-1/4 bg-muted rounded-[6px]" />
        <div className="h-10 w-32 bg-muted rounded-[10px]" />
      </div>
      <div className="h-16 bg-background-secondary border border-border rounded-[16px] p-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-[12px] p-5 h-20" />
        ))}
      </div>
    </div>
  )
}
