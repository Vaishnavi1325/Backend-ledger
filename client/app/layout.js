import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
export const metadata = {
    title: "Bank Transaction System - Secure Double-Entry Banking Platform",
    description: "A secure double-entry banking and ledger application",
};
export default function RootLayout({ children, }) {
    return (<html lang="en" className="font-sans antialiased">
      <body>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>);
}
