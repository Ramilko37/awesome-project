export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#edf2f7] text-slate-950">
      {children}
    </main>
  );
}
