export default function Header() {
  return (
    <div className="flex flex-1 flex-col h-[120px] max-h-min justify-center text-3xl font-medium tracking-tight items-center pt-6">
      <h1>
        concert{"{"}
        <span className="text-3xl tracking-tight font-semibold text-zinc-100">
          fyi
        </span>
        {"}"}
      </h1>
      <h1 className="text-4xl top-0 font-bold text-center text-zinc-100 tracking-tight pt-4">
        Live Music Lives Here.
      </h1>
    </div>
  );
}