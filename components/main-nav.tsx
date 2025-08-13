"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BarChart2,
  Clock,
  Layers,
  List,
  Menu,
  Pickaxe,
  Globe,
  ChevronDown,
  X,
  Home,
  ExternalLink,
  Newspaper,
  MessageCircle,
  Code,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search-bar"
import { useState, useEffect, useRef } from "react"

export function MainNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRefs = useRef({})

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideDropdown = Object.values(dropdownRefs.current).some((ref) => ref && ref.contains(event.target))
      if (!isClickInsideDropdown) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setOpenDropdown(null)
  }, [pathname])

  const explorerRoutes = [
    { href: "/blocks", label: "Blocks", icon: <Layers className="h-4 w-4" /> },
    { href: "/transactions", label: "Transactions", icon: <List className="h-4 w-4" /> },
    { href: "/mempool", label: "Mempool", icon: <Clock className="h-4 w-4" /> },
    { href: "/mining", label: "Mining", icon: <Pickaxe className="h-4 w-4" /> },
    { href: "/richlist", label: "Rich List", icon: <BarChart2 className="h-4 w-4" /> },
    { href: "/network", label: "Network", icon: <Globe className="h-4 w-4" /> },
    { href: "/api", label: "API", icon: <Code className="h-4 w-4" /> },
  ]

  const toggleDropdown = (dropdownName, e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    setOpenDropdown(null)
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#111727] border-b border-slate-700/30">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.png" alt="AdventureCoin Logo" width={32} height={32} />
              <div className="flex items-center space-x-1">
                <span className="font-bold text-xl text-white">ADVC</span>
                <span className="text-blue-400 font-medium">Explorer</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="https://adventurecoin.quest"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                target="_blank"
              >
                Main Site
              </Link>

              {/* Explorer Dropdown */}
              <div className="relative" ref={(el) => (dropdownRefs.current.explorer = el)}>
                <button
                  onClick={(e) => toggleDropdown("explorer", e)}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  <span>Explorer</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openDropdown === "explorer" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a2238] border border-slate-600/50 rounded-lg shadow-xl py-2">
                    {/* Home Link at the top */}
                    <Link
                      href="/"
                      className={`flex items-center space-x-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors border-b border-slate-600/30 mb-1 ${
                        pathname === "/" ? "text-blue-400 bg-slate-700/50" : "text-gray-300 hover:text-white"
                      }`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </Link>
                    {explorerRoutes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={`flex items-center space-x-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                          pathname === route.href ? "text-blue-400 bg-slate-700/50" : "text-gray-300 hover:text-white"
                        }`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {route.icon}
                        <span>{route.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Explorers Dropdown */}
              <div className="relative" ref={(el) => (dropdownRefs.current.explorers = el)}>
                <button
                  onClick={(e) => toggleDropdown("explorers", e)}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  <span>Other Explorers</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openDropdown === "explorers" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a2238] border border-slate-600/50 rounded-lg shadow-xl py-2">
                    <a
                      href="https://explorer.adventurecoin.quest"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      Secondary Explorer
                    </a>
                    <a
                      href="https://advcview.ribbitx.com"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      Ribbitx Explorer
                    </a>
                  </div>
                )}
              </div>

              {/* Faucets Dropdown */}
              <div className="relative" ref={(el) => (dropdownRefs.current.faucets = el)}>
                <button
                  onClick={(e) => toggleDropdown("faucets", e)}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  <span>Faucets</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openDropdown === "faucets" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a2238] border border-slate-600/50 rounded-lg shadow-xl py-2">
                    <a
                      href="https://advc.ribbitx.com/faucet"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      Ribbitx Faucet
                    </a>
                    <a
                      href="https://trade.nestex.one/asset/ADVC"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      Nestex Faucet
                    </a>
                    {/* <a
                      href="https://aegisumexplorer.com/faucet"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      Community Faucet
                    </a> */}
                  </div>
                )}
              </div>

              {/* Exchanges Dropdown */}
              <div className="relative" ref={(el) => (dropdownRefs.current.exchanges = el)}>
                <button
                  onClick={(e) => toggleDropdown("exchanges", e)}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  <span>Exchanges</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openDropdown === "exchanges" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a2238] border border-slate-600/50 rounded-lg shadow-xl py-2">
                    <a
                      href="https://nestex.one/spot/advc"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      NestEx
                    </a>
                    <a
                      href="https://app.exbitron.com/exchange/?market=ADVC-USDT"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      ExBitron
                    </a>
                    <a
                      href="https://rabid-rabbit.org/account/trade/ADVC-USDT"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      RabidRabbit
                    </a>
                  </div>
                )}
              </div>

              {/* <a
                href="https://pool.aegisum.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Mining Pool
              </a> */}

              {/* Wallets Dropdown */}
              <div className="relative" ref={(el) => (dropdownRefs.current.wallets = el)}>
                <button
                  onClick={(e) => toggleDropdown("wallets", e)}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  <span>Wallets</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openDropdown === "wallets" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a2238] border border-slate-600/50 rounded-lg shadow-xl py-2">
                    <a
                      href="https://github.com/AdventureCoin-ADVC/AdventureCoin/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      Core Wallet
                    </a>
                    <a
                      href="https://explorer.adventurecoin.quest/wallet/#"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      Web Wallet
                    </a>
                  </div>
                )}
              </div>

              {/* <Link
                href="https://aegisum.com/news"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                target="_blank"
              >
                News
              </Link> */}
            </nav>

            {/* Right side - Search only */}
            <div className="hidden lg:flex items-center">
              <SearchBar className="w-64" />
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="text-white hover:bg-slate-800/50"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="lg:hidden pb-4">
            <SearchBar className="w-full" />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay - WITH REACT ICONS */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu} />
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-[#0b0f1a] flex flex-col">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="space-y-6">
                  {/* Extra whitespace at top */}
                  <div className="h-4"></div>

                  {/* Main Links */}
                  <div className="space-y-4">
                    <Link
                      href="https://adventurecoin.quest"
                      target="_blank"
                      className="flex items-center space-x-3 text-gray-300 hover:text-white text-lg font-medium"
                      onClick={toggleMobileMenu}
                    >
                      <Home className="h-5 w-5" />
                      <span>Main Site</span>
                    </Link>
                  </div>

                  {/* Explorer Section */}
                  <div className="border-t border-slate-700/30 pt-6">
                    <h3 className="flex items-center space-x-2 text-blue-400 font-semibold mb-4 text-lg">
                      <Globe className="h-5 w-5" />
                      <span>Explorer</span>
                    </h3>
                    <div className="space-y-3 pl-4">
                      {/* Home Link for mobile */}
                      <Link
                        href="/"
                        className={`flex items-center space-x-3 text-base ${
                          pathname === "/" ? "text-blue-400" : "text-gray-300 hover:text-white"
                        }`}
                        onClick={toggleMobileMenu}
                      >
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                      </Link>
                      {explorerRoutes.map((route) => (
                        <Link
                          key={route.href}
                          href={route.href}
                          className={`flex items-center space-x-3 text-base ${
                            pathname === route.href ? "text-blue-400" : "text-gray-300 hover:text-white"
                          }`}
                          onClick={toggleMobileMenu}
                        >
                          {route.icon}
                          <span>{route.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* External Links */}
                  <div className="border-t border-slate-700/30 pt-6">
                    <h3 className="flex items-center space-x-2 text-blue-400 font-semibold mb-4 text-lg">
                      <ExternalLink className="h-5 w-5" />
                      <span>External Links</span>
                    </h3>
                    <div className="space-y-3 pl-4">
                      {/* <a
                        href="https://pool.aegisum.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-3 text-gray-300 hover:text-white text-base"
                        onClick={toggleMobileMenu}
                      >
                        <Pickaxe className="h-4 w-4" />
                        <span>Mining Pool</span>
                      </a> */}
                      {/* <Link
                        href="https://aegisum.com/news"
                        target="_blank"
                        className="flex items-center space-x-3 text-gray-300 hover:text-white text-base"
                        onClick={toggleMobileMenu}
                      >
                        <Newspaper className="h-4 w-4" />
                        <span>News</span>
                      </Link> */}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="border-t border-slate-700/30 pt-6">
                    <h3 className="flex items-center space-x-2 text-blue-400 font-semibold mb-4 text-lg">
                      <MessageCircle className="h-5 w-5" />
                      <span>Community</span>
                    </h3>
                    <div className="flex space-x-4 pl-4">
                      <a
                        href="https://discord.gg/4TfdDpgkbN"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-300 hover:text-white text-base"
                        onClick={toggleMobileMenu}
                      >
                        Discord
                      </a>
                      <a
                        href="https://x.com/AdventureCoinAD"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-300 hover:text-white text-base"
                        onClick={toggleMobileMenu}
                      >
                        Twitter
                      </a>
                      <a
                        href="https://www.reddit.com/r/AdventureCoin"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-300 hover:text-white text-base"
                        onClick={toggleMobileMenu}
                      >
                        Reddit
                      </a>
                      <a
                        href="https://www.twitch.tv/discordvickers"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-300 hover:text-white text-base"
                        onClick={toggleMobileMenu}
                      >
                        Twitch
                      </a>
                    </div>
                  </div>

                  {/* Extra padding for safe scrolling */}
                  <div className="h-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
