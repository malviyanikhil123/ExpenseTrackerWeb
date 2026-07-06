import { useState } from "react"
import { Plus, Search, MoreVertical, Edit2, Trash2, FolderOpen, AlertCircle, Info } from "lucide-react"
import * as Icons from "lucide-react"
import { toast } from "sonner"

import {
  useCategoriesList,
  useCategoryIcons,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useCategories"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { DropdownMenu } from "../../../components/ui/dropdown-menu"

const COLOR_PALETTE = [
  "#706677",
  "#565264",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#14B8A6",
]

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  
  const [catName, setCatName] = useState("")
  const [catColor, setCatColor] = useState(COLOR_PALETTE[0])
  const [selectedIconId, setSelectedIconId] = useState("")

  const { data: categories = [], isLoading, isError, refetch } = useCategoriesList(activeTab)
  const { data: icons = [] } = useCategoryIcons()

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenCreate = () => {
    setCatName("")
    setCatColor(COLOR_PALETTE[0])
    
    // Auto-select first icon that matches active tab type
    const tabIcons = icons.filter((i) => i.type === activeTab)
    setSelectedIconId(tabIcons[0]?.id || "")
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (category: any) => {
    setSelectedCategory(category)
    setCatName(category.name)
    setCatColor(category.color || COLOR_PALETTE[0])
    setSelectedIconId(category.categoryIconId)
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

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      
      {/* Header (Section 71) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage transaction classifications.</p>
        </div>
        <CustomButton variant="primary" size="md" className="gap-2 w-full sm:w-auto" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add Category
        </CustomButton>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card/50 p-4 rounded-[16px] border border-border">
        
        {/* Tab switch group */}
        <div className="flex bg-muted p-1 rounded-[10px] self-start md:self-auto w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("EXPENSE")}
            className={cn(
              "flex-1 md:flex-none px-5 py-2 rounded-[8px] text-xs font-semibold select-none transition-colors cursor-pointer",
              activeTab === "EXPENSE" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Expense Categories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("INCOME")}
            className={cn(
              "flex-1 md:flex-none px-5 py-2 rounded-[8px] text-xs font-semibold select-none transition-colors cursor-pointer",
              activeTab === "INCOME" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Income Categories
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by category name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full pl-9 pr-4 bg-card text-foreground border border-border rounded-[10px] text-xs outline-none focus:border-primary transition-colors font-sans"
          />
        </div>

      </div>

      {/* Category List / Grid (Section 71) */}
      {filteredCategories.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-2 border border-dashed border-border bg-card rounded-[16px]">
          <FolderOpen className="size-10" />
          <span>No categories found in this group.</span>
          <CustomButton variant="outline" size="sm" className="mt-2" onClick={handleOpenCreate}>
            Create Category
          </CustomButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredCategories.map((cat) => {
            const iconObj = icons.find((i) => i.id === cat.categoryIconId)
            const iconName = iconObj?.iconKey || "FolderOpen"

            return (
              <div
                key={cat.id}
                className="bg-card border border-border rounded-[12px] p-5 shadow-card flex items-center justify-between hover:shadow-md transition-shadow relative text-card-foreground"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="size-10 rounded-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color || COLOR_PALETTE[0]}10` }}
                  >
                    {renderIcon(iconName, cat.color || COLOR_PALETTE[0])}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                    <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                      {cat.type}
                    </span>
                  </div>
                </div>

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
            )
          })}
        </div>
      )}

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
            <span className="text-xs font-semibold text-gray-600 select-none">Theme Color</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    catColor === color ? "border-gray-900 scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-600 select-none">Icon Representation</span>
            <div className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto border border-border rounded-[10px] p-2 bg-muted/30">
              {icons
                .filter((icon) => icon.type === activeTab)
                .map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setSelectedIconId(icon.id)}
                    className={cn(
                      "aspect-square rounded-[8px] border flex items-center justify-center bg-card text-foreground cursor-pointer hover:bg-muted transition-colors",
                      selectedIconId === icon.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    {renderIcon(icon.iconKey, selectedIconId === icon.id ? catColor : "#94a3b8")}
                  </button>
                ))}
            </div>
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
            <span className="text-xs font-semibold text-gray-600 select-none">Theme Color</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatColor(color)}
                  className={cn(
                    "size-7 rounded-full border transition-all cursor-pointer",
                    catColor === color ? "border-gray-900 scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-600 select-none">Icon Representation</span>
            <div className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto border border-border rounded-[10px] p-2 bg-muted/30">
              {icons
                .filter((icon) => icon.type === (selectedCategory?.type || activeTab))
                .map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setSelectedIconId(icon.id)}
                    className={cn(
                      "aspect-square rounded-[8px] border flex items-center justify-center bg-card text-foreground cursor-pointer hover:bg-muted transition-colors",
                      selectedIconId === icon.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    {renderIcon(icon.iconKey, selectedIconId === icon.id ? catColor : "#94a3b8")}
                  </button>
                ))}
            </div>
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
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
        <div className="h-10 w-32 bg-gray-200 rounded-[10px]" />
      </div>
      <div className="h-16 bg-gray-50 border border-gray-100 rounded-[16px] p-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-[12px] p-5 h-20" />
        ))}
      </div>
    </div>
  )
}
