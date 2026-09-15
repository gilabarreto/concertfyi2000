import { Component } from "react";

// Precisa ser classe: React não tem hook equivalente a componentDidCatch.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="w-full bg-red-600 flex flex-col items-center justify-center gap-4 p-6 text-white text-center">
        <p className="text-lg font-semibold tracking-tight">
          Something broke on this page.
        </p>
        <p className="text-base font-medium tracking-tight">
          The rest of the site still works.
        </p>
        {/* Recarrega em vez de resetar o state: volta limpo sem depender do router. */}
        <a
          href="/"
          className="bg-white text-red-600 font-semibold tracking-tight rounded-2xl px-6 py-2 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))]"
        >
          Back to home
        </a>
      </div>
    );
  }
}
