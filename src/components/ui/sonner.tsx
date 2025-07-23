import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import type { ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <>
      <style>
        {`
          .toaster [data-sonner-toast] {
            background: white !important;
            color: black !important;
          }
          .toaster [data-sonner-toast] [data-description] {
            color: #374151 !important;
            font-weight: 500 !important;
          }
          .toaster [data-sonner-toast][data-type="success"] [data-description] {
            color: #166534 !important;
            font-weight: 500 !important;
          }
          .toaster [data-sonner-toast][data-type="error"] [data-description] {
            color: #dc2626 !important;
            font-weight: 500 !important;
          }
        `}
      </style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        {...props}
      />
    </>
  )
}

export { Toaster }
