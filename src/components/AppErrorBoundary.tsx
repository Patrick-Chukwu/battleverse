import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Battleverse render error", error, info.componentStack);
  }

  private reset = () => {
    try {
      localStorage.removeItem("battleverse-game");
    } catch {
      /* ignore quota / private mode */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <p className="mb-4 text-5xl">🎮</p>
        <h1 className="text-2xl font-black">Battleverse hit a snag</h1>
        <p className="mt-2 max-w-md font-bold text-muted-foreground">{this.state.error.message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-primary px-6 py-3 font-black text-primary-foreground"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-2xl border-2 border-border bg-card px-6 py-3 font-black"
          >
            Reset local profile and reload
          </button>
        </div>
      </div>
    );
  }
}
