import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata = {
    title: "Bank Transaction System - Secure Double-Entry Banking Platform",
    description: "A secure double-entry banking and ledger application",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="font-sans antialiased" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    <QueryProvider>
                        <AuthProvider>
                            <ToastProvider>{children}</ToastProvider>
                        </AuthProvider>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
