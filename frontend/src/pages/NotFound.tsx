import { FileQuestion } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { CustomButton } from "../components/buttons/CustomButton"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-[480px] bg-card border border-border rounded-[16px] p-8 shadow-card flex flex-col items-center text-center gap-6">
        
        {/* Visual Illustration */}
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-sm animate-pulse">
          <FileQuestion className="size-8" />
        </div>

        {/* Text descriptions */}
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-none">Page Not Found</h1>
          <p className="text-[14px] font-normal text-muted-foreground mt-1.5 leading-normal max-w-[320px]">
            The route you requested does not exist or you do not have sufficient permissions to view it.
          </p>
        </div>

        {/* CTA Action button */}
        <CustomButton variant="primary" size="md" className="w-full sm:w-auto px-8" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </CustomButton>

      </div>
    </div>
  )
}
