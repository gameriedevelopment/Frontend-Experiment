import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/errors";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { acceptInvite, lookupInvite } from "./api";
import { AuthLayout } from "./AuthLayout";

export function AcceptInvitePage() {
  useDocumentTitle("Accept invitation");
  const token = useSearchParams()[0].get("token") ?? "";
  const invite = useQuery({ queryKey: ["admin-invite", token], queryFn: () => lookupInvite(token), enabled: Boolean(token), retry: false });
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const accept = useMutation({
    mutationFn: () =>
      acceptInvite({
        token,
        fullName: fullName.trim() || undefined,
        username: username.trim() || undefined,
        password: password || undefined,
      }),
  });

  const details = invite.data;
  const mismatch = Boolean(details?.requiresPassword && confirm && password !== confirm);
  const ready =
    details &&
    (!details.requiresProfile || (fullName.trim() && username.trim().length >= 3)) &&
    (!details.requiresPassword || (password.length >= 8 && password === confirm));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) accept.mutate();
  };

  if (accept.isSuccess) {
    return (
      <AuthLayout>
        <span className="grid size-12 place-items-center rounded-full bg-signal/12 text-signal ring-1 ring-inset ring-signal/30">
          <Icon name="check" weight="bold" className="size-5" />
        </span>
        <h1 className="type-display mt-6 text-display-sm">You're an admin</h1>
        <p className="mt-3 text-sm text-mist-400">Your access is ready. Sign in with {details?.email}.</p>
        <LinkButton to="/sign-in" className="mt-8 w-full">
          Sign in
        </LinkButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="type-display text-display-sm">Join the admin team</h1>
      {!token ? (
        <Notice tone="danger" className="mt-6">This invitation link is incomplete. Open the link from your email again.</Notice>
      ) : invite.isLoading ? (
        <div className="mt-8 grid gap-4">
          <Skeleton className="h-5 w-3/4 rounded-full" />
          <Skeleton className="h-12 rounded-tile" />
          <Skeleton className="h-12 rounded-tile" />
        </div>
      ) : invite.isError || !details ? (
        <Notice tone="danger" className="mt-6">
          {getApiErrorMessage(invite.error, "This invitation has expired or was already used. Ask the person who invited you for a new one.")}
        </Notice>
      ) : (
        <>
          <p className="mt-3 text-sm text-mist-400">
            {details.invitedByEmail ? `${details.invitedByEmail} invited ` : "You were invited as "}
            <span className="font-semibold text-mist-100">{details.email}</span>
            {details.invitedByEmail ? " to run Gamerie with them." : "."}
          </p>
          {accept.isError && (
            <Notice tone="danger" className="mt-6">
              {getApiErrorMessage(accept.error, "That didn't go through. Check the details and try again.")}
            </Notice>
          )}
          <form className="mt-8 grid gap-5" onSubmit={onSubmit} noValidate>
            {details.requiresProfile && (
              <>
                <TextField id="full-name" label="Full name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                <TextField id="username" label="Username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
              </>
            )}
            {details.requiresPassword ? (
              <>
                <PasswordField id="password" label="Password (at least 8 characters)" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <PasswordField
                  id="confirm"
                  label="Confirm password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  error={mismatch ? "The passwords don't match." : undefined}
                />
              </>
            ) : (
              <p className="text-sm text-mist-400">You'll sign in with the password you already use on Gamerie.</p>
            )}
            <Button type="submit" className="mt-2 w-full" disabled={!ready || accept.isPending}>
              {accept.isPending ? "Accepting…" : "Accept invitation"}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
