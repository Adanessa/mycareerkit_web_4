export default function Navbar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = usePathname()  // ← This tells us what page we're on

  // Change hash links to actual page routes
  const navItems = [
    { label: 'Hem', href: '/' },  // ← Just slash for homepage
    { label: 'Sök Jobb', href: '/process' },  // ← New process page
    { label: 'Galleri', href: '/gallery' },  // ← Future gallery
    { label: 'Teknik', href: '/tech' },  // ← Future tech page
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Make it clickable to home */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-colors rounded-full" />
                <Briefcase className="relative w-8 h-8 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">MyCareerKit</span>
                <span className="text-xs text-muted-foreground">AI-drivna karriärverktyg</span>
              </div>
            </motion.div>
          </Link>

          {/* Navigation Items - Use Link instead of <a> */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href}>
                <motion.div
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  whileHover={{ y: -2 }}
                  className="relative py-2 text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    color: pathname === item.href ? 'white' : '#888',  // Highlight current page
                  }}
                >
                  {item.label}
                  {(hoveredItem === item.label || pathname === item.href) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
                    />
                  )}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Coming Soon Badge */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30"
          >
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Kommer Snart
            </span>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}