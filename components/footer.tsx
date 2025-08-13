import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} AdventureCoin Blockchain Explorer. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/CryptoDevelopmentServices/adventurecoin-block-explorer/"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>Explorer v1.3</span>
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link
            href="https://adventurecoin.quest"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium underline underline-offset-4"
          >
            Official Website
          </Link>
        </div>
      </div>
    </footer>
  )
}
