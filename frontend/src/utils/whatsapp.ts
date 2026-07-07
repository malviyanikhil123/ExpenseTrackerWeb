import { format } from "date-fns"
import { toast } from "sonner"

export interface GenerateWhatsAppLinkParams {
  phone: string
  message: string
}

export function generateWhatsAppLink({ phone, message }: GenerateWhatsAppLinkParams): string {
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(url: string): void {
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = url
    } else {
      const newWindow = window.open(url, "_blank")
      if (!newWindow) {
        toast.error("Unable to open WhatsApp.")
      }
    }
  } catch (error) {
    toast.error("Unable to open WhatsApp.")
  }
}

export interface DebtReminderParams {
  partyName: string
  type: "BORROW" | "LENT"
  amount: number
  remainingAmount: number
  dueDate?: string | null
  senderName?: string | null
}

export function generateDebtReminderMessage({
  partyName,
  type,
  amount,
  remainingAmount,
  dueDate,
  senderName,
}: DebtReminderParams): string {
  const formattedAmount = `₹${remainingAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
  const formattedOriginalAmount = `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
  const sender = senderName || "Expense Tracker"

  const dueSection = dueDate
    ? `\n\nDue Date:\n${format(new Date(dueDate), "d MMMM yyyy")}`
    : type === "LENT"
      ? `\n\nPlease repay when possible.`
      : ""

  if (type === "BORROW") {
    return `Hello ${partyName},\n\nThis is a reminder from ${sender}.\n\nI have recorded that I borrowed ${formattedOriginalAmount} from you.\n\nOutstanding Amount:\n${formattedAmount}${dueSection}\n\nThank you.`
  } else {
    return `Hello ${partyName},\n\nThis is a reminder from ${sender}.\n\nI have recorded that I lent you ${formattedOriginalAmount}.\n\nOutstanding Amount:\n${formattedAmount}${dueSection}\n\nThank you.`
  }
}

export interface RepaymentReminderParams {
  partyName: string
  type: "BORROW" | "LENT"
  amountPaid: number
  remainingAmount: number
  senderName?: string | null
}

export function generateRepaymentReminderMessage({
  partyName,
  type,
  amountPaid,
  remainingAmount,
  senderName,
}: RepaymentReminderParams): string {
  const formattedPaid = `₹${amountPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
  const formattedRemaining = `₹${remainingAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
  const sender = senderName || "Expense Tracker"

  if (type === "LENT") {
    return `Hello ${partyName},\n\nThank you for paying ${formattedPaid}.\n\nRemaining Balance:\n${formattedRemaining}\n\n${sender} has updated the payment.\n\nThank you.`
  } else {
    return `Hello ${partyName},\n\nI have paid ${formattedPaid}.\n\nRemaining Amount:\n${formattedRemaining}\n\nThank you.`
  }
}
