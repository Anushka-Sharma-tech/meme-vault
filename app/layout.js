import './globals.css';
import { ThemeProvider } from './context/ThemeContext';
import AnimeMascot from './components/AnimeMascot';
import GlobalChat from './components/GlobalChat';
import ProfilePanelWrapper from './components/ProfilePanelWrapper';
import CookieBanner from './components/CookieBanner';

export const metadata = {
  title: 'MemeVault Secure Platform',
  description: 'Production social meme network engine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-[#0a0a0a] text-zinc-200 antialiased selection:bg-orange-600 selection:text-white min-h-screen flex flex-col">
        <ThemeProvider>
          
          {/* Main Workspace Frame */}
          <div className="flex-1">
            {children}
          </div>

          {/* Global Legal Footer - Accessible on all pages */}
          <footer className="w-full py-8 border-t border-zinc-800/60 bg-black/40 backdrop-blur-md text-center text-xs text-zinc-500 z-40 relative">
            <p>&copy; {new Date().getFullYear()} MemeVault. All rights reserved.</p>
            <div className="flex justify-center gap-6 mt-3 font-medium tracking-wide">
              <a href="/terms" className="hover:text-orange-500 transition-colors cursor-pointer">
                Terms of Service
              </a>
              <a href="/privacy" className="hover:text-orange-500 transition-colors cursor-pointer">
                Privacy Policy
              </a>
            </div>
          </footer>

          {/* System Control Overlays */}
          <AnimeMascot />
          <GlobalChat />
          <ProfilePanelWrapper />
          
          {/* Legal Compliance Banner Overlay */}
          <CookieBanner />

        </ThemeProvider>
      </body>
    </html>
  );
}