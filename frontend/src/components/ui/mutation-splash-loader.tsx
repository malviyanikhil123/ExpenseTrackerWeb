import React from "react"
import { useIsMutating } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

export const MutationSplashLoader: React.FC = () => {
  const isMutating = useIsMutating()

  if (isMutating === 0) return null

  return (
    <div className="fixed inset-0 bg-[#0f172a]/20 dark:bg-black/40 backdrop-blur-xs z-[99999] flex flex-col items-center justify-center gap-3 select-none">
      <div className="bg-card border border-border p-6 rounded-[20px] shadow-modal flex flex-col items-center gap-4 text-center max-w-xs animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="size-10 animate-spin text-primary" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-foreground">Processing Request</p>
          <p className="text-2xs text-muted-foreground leading-normal px-2">
            Please wait while we update your financial ledger.
          </p>
        </div>
      </div>
    </div>
  )
}
