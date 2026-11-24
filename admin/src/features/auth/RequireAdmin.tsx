import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { TokenMark } from "@/components/ui/TokenMark";
import { useSession } from "./session";

/** Checks the stored admin token once, then keeps everyone else on the sign-in screen. */
export function RequireAdmin() {
  const status = useSession((state) => state.status);
  const restore = useSession((state) => state.restore);
  const signOut = useSession((state) => state.signOut);
  const location = useLocation();

  useEffect(() => {
    if (status === "checking") void restore();
    // Only the first check runs here; retries come from the button below.
  }, []);

  if (status === "checking") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <TokenMark className="h-10 animate-blink text-lavender-400" />
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="grid max-w-sm justify-items-center text-center">
          <TokenMark className="h-10 text-lavender-400" />
          <h1 className="mt-8 text-lg font-semibold">Gamerie isn't answering</h1>
          <p className="mt-2 text-sm text-mist-400">The server didn't respond. Check it's running, then try again.</p>
          <div className="mt-6 flex gap-2">
            <Button size="sm" icon="refresh" onClick={() => void restore()}>
              Try again
            </Button>
            <Button size="sm" tone="ghost" onClick={() => signOut()}>
              Sign in again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (status === "signed-out") {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={next === "/" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`} replace />;
  }
  return <Outlet />;
}
