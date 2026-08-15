export default function Header() {
  return (
    <div
      className="flex flex-1 flex-col h-[120px] max-h-min justify-center items-center text-center"
    >
      <h1 className="text-2xl font-medium tracking-tight">
        concert{"{"}
        <span className="text-2xl font-semibold text-zinc-100">fyi</span>
        {"}"}
      </h1>

      <h2 className="text-3xl font-bold text-zinc-100 tracking-tight pt-2">
        Live Music Lives Here.
      </h2>
    </div>
  );
}
