"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group pointer-events-auto"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto data-[visible=false]:pointer-events-none group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          closeButton: "pointer-events-auto",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "pointer-events-auto group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "pointer-events-auto group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
