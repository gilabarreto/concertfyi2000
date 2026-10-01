export default function CardNotice({ children }) {
  return (
    <div className="flex min-h-32 flex-1 flex-col items-center justify-center gap-2 px-[12px] py-6 text-center text-zinc-500">
      {children}
    </div>
  );
}
