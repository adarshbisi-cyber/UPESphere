import Link from 'next/link'
import { GraduationCap, Github, Twitter } from 'lucide-react'

const links = {
  Tools: [
    { label: 'GPA Calculator', href: '/gpa' },
    { label: 'CGPA Calculator', href: '/cgpa' },
    { label: 'Attendance Tracker', href: '/attendance' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Contact', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold font-display bg-gradient-to-r dark:from-white dark:to-white/60 from-slate-900 to-slate-600 bg-clip-text text-transparent">
                UPESphere
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The smartest academic companion for Indian students. Track GPA, CGPA, attendance, and unlock your academic potential.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground/70 mb-4 tracking-wider uppercase">{title}</h3>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} UPESphere. Built for students, by{' '}
            <a
              href="https://www.linkedin.com/in/adarshbisi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Adarsh
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Made with love in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  )
}
