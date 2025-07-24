export default function Header() {
  return (
    <div
      className="flex flex-1 flex-col h-[120px] max-h-min justify-center items-center pt-6 text-center"
    >
      <h1 className="text-3xl font-medium tracking-tight">
        concert{"{"}
        <span className="text-3xl font-semibold text-zinc-100">fyi</span>
        {"}"}
      </h1>

      <h2 className="text-4xl font-bold text-zinc-100 tracking-tight pt-4">
        Live Music Lives Here.
      </h2>
    </div>
  );
}
