import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { NotAnAdminError, signIn } from "./api";
import { AuthLayout } from "./AuthLayout";
import { useSession } from "./session";

const NOTICES = {
  expired: "Your session ended. Sign in again to carry on.",
  revoked: "This account no longer has admin access. Ask a super admin if that's a mistake.",
} as const;

export function SignInPage() {
  useDocumentTitle("Sign in");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = useSession((state) => state.status);
  const notice = useSession((state) => state.notice);
  const signedIn = useSession((state) => state.signedIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/";

  const submit = useMutation({
    mutationFn: () => signIn(email.trim(), password),
    onSuccess: (user) => {
      signedIn(user);
      navigate(next, { replace: true });
    },
  });

  if (status === "signed-in") return <Navigate to={next} replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (email.trim() && password) submit.mutate();
  };

  const error = submit.error
    ? submit.error instanceof NotAnAdminError
      ? submit.error.message
      : getApiErrorMessage(submit.error, "That email and password didn't work. Check them and try again.")
    : null;

  return (
    <AuthLayout>
      <h1 className="type-display text-display-sm">Sign in</h1>
      <p className="mt-3 text-sm text-mist-400">Admin accounts only.</p>
      {notice && !error && <Notice tone="info" className="mt-6">{NOTICES[notice]}</Notice>}
      {error && <Notice tone="danger" className="mt-6">{error}</Notice>}
      <form className="mt-8 grid gap-5" onSubmit={onSubmit} noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={tried && !email.trim() ? "Enter your email." : undefined}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={tried && !password ? "Enter your password." : undefined}
        />
        <Button type="submit" className="mt-2 w-full" disabled={submit.isPending}>
          {submit.isPending ? "Checking…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
