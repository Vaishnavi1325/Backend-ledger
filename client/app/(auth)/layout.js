export default function AuthLayout({ children, }) {
    return (<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {children}
    </div>);
}
