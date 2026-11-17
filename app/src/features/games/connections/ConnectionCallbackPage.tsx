import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LinkButton } from "@/components/ui/Button";
import { FullScreenLoader } from "@/components/ui/Loader";
import { StatePanel } from "@/components/ui/StatePanel";
import { toast } from "@/lib/toast";
import { clearConnectionCallback, connectProvider, finishLichessConnection, readConnectionCallback } from "./api";
import { getProvider } from "./registry";

/** Where Steam and Lichess send players back after they approve the link. */
export function ConnectionCallbackPage({ source }: { source: "steam" | "lichess" }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // Strict mode runs effects twice in development; the code can only be exchanged once.
    if (started.current) return;
    started.current = true;
    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      // The address carries a one-time proof or code; take it out before anything else can read it.
      window.history.replaceState(null, "", window.location.pathname);
      const pending = readConnectionCallback();
      try {
        const providerError = params.get("error_description") || params.get("error");
        if (providerError) throw new Error(providerError);
        const returnedState = params.get("state");
        if (!returnedState || returnedState !== pending.state) throw new Error("This link couldn't be verified safely. Please try again.");
        if (source === "steam") {
          const proof = params.get("proof");
          if (!proof || !pending.provider || !["steam", "dota-2", "cs2"].includes(pending.provider))
            throw new Error("Steam returned an incomplete connection.");
          await connectProvider(pending.provider, { proof });
        } else {
          const code = params.get("code");
          if (!code || !pending.verifier || pending.provider !== "lichess") throw new Error("Lichess returned an incomplete connection.");
          await finishLichessConnection(code, pending.verifier);
        }
        const name = pending.provider ? getProvider(pending.provider)?.name : source;
        clearConnectionCallback();
        toast.success(`${name} linked`, "Your verified stats show on your Player Card.");
        navigate(pending.returnTo, { replace: true });
      } catch (reason) {
        clearConnectionCallback();
        setError(reason instanceof Error ? reason.message : "The connection failed.");
      }
    };
    void finish();
  }, [navigate, source]);

  if (!error) return <FullScreenLoader label={`Linking your ${source === "steam" ? "Steam" : "Lichess"} account`} />;
  return (
    <div className="grid min-h-svh place-items-center p-6">
      <StatePanel
        icon="link"
        tone="danger"
        title={`${source === "steam" ? "Steam" : "Lichess"} wasn't linked`}
        description={error}
        action={
          <LinkButton to="/home" tone="outline" size="sm">
            Back to Gamerie
          </LinkButton>
        }
        className="w-full max-w-md"
      />
    </div>
  );
}
