import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";

// After a deploy, an open tab can ask for code files that no longer exist.
const staleBuild = /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|Loading chunk/i;

interface Props {
  children: ReactNode;
  /** Changing this (for example the current path) clears a caught error. */
  resetKey?: string;
  /** Inside the shell, a home link; outside it, only a reload makes sense. */
  withinApp?: boolean;
}

/** Keeps one broken screen from blanking the whole app, and turns stale-deploy failures into a reload. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const updated = staleBuild.test(error.message);
    return (
      <div className="grid min-h-[60svh] place-items-center px-4 py-16">
        <StatePanel
          icon={updated ? "refresh" : "warning"}
          tone={updated ? "neutral" : "danger"}
          title={updated ? "Gamerie has been updated" : "This screen hit a problem"}
          description={updated ? "Reload to get the latest version. Nothing you've saved is lost." : "Try again, and if it keeps happening, head home and come back to it."}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" icon="refresh" onClick={() => (updated ? window.location.reload() : this.setState({ error: null }))}>
                {updated ? "Reload" : "Try again"}
              </Button>
              {this.props.withinApp && !updated && (
                <LinkButton to="/home" tone="outline" size="sm" onClick={() => this.setState({ error: null })}>
                  Go home
                </LinkButton>
              )}
            </div>
          }
        />
      </div>
    );
  }
}
