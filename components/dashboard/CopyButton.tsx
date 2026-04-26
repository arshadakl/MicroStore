"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface CopyButtonProps {
  text: string
  className?: string
}

/**
 * A button that copies text to clipboard with visual feedback
 */
export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[CopyButton] Failed to copy:", error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`shrink-0 gap-2 ${className ?? ""}`}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy
        </>
      )}
    </Button>
  )
}
