import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { checkPhoneCode, sendPhoneCode, syncUserWithBackend } from "@/features/auth/api";
import { getApiErrorMessage } from "@/lib/errors";

const RESEND_SECONDS = 30;

function countryOptions() {
  const names = new Intl.DisplayNames(undefined, { type: "region" });
  return getCountries()
    .map((code) => ({ value: code, label: `${names.of(code) ?? code} (+${getCountryCallingCode(code)})` }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function guessCountry(current?: string | null): CountryCode {
  const fromNumber = current ? parsePhoneNumberFromString(current)?.country : undefined;
  if (fromNumber) return fromNumber;
  const region = new Intl.Locale(navigator.language).maximize().region as CountryCode | undefined;
  return region && getCountries().includes(region) ? region : "US";
}

export const formatPhone = (value: string) => parsePhoneNumberFromString(value)?.formatInternational() ?? value;

/** Send a code to a number and confirm it. The account's number only changes once the code checks out. */
export function PhoneVerification({ current, onDone, onCancel }: { current?: string | null; onDone: () => void; onCancel: () => void }) {
  const countries = useMemo(countryOptions, []);
  const [country, setCountry] = useState<CountryCode>(() => guessCountry(current));
  const [countryQuery, setCountryQuery] = useState("");
  const [number, setNumber] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const options = useMemo(() => {
    const term = countryQuery.trim().toLowerCase();
    return countries.filter((option) => !term || option.label.toLowerCase().includes(term));
  }, [countries, countryQuery]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const parsed = parsePhoneNumberFromString(number, country);
    if (!parsed?.isValid()) return setError("That doesn't look like a valid number for the country you picked.");
    if (current && parsed.number === current) return setError("That's already your number.");
    setError("");
    setPending(true);
    try {
      await sendPhoneCode(parsed.number);
      setSentTo(parsed.number);
      setCode("");
      setWait(RESEND_SECONDS);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "We couldn't send a code. Try again in a moment."));
    } finally {
      setPending(false);
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!sentTo) return;
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    setError("");
    setPending(true);
    try {
      await checkPhoneCode(sentTo, code);
      await syncUserWithBackend();
      onDone();
    } catch (reason) {
      setError(getApiErrorMessage(reason, "That code is wrong or has expired."));
    } finally {
      setPending(false);
    }
  };

  if (sentTo)
    return (
      <form onSubmit={verify} className="grid gap-4" noValidate>
        <p className="text-sm text-mist-300">
          We sent a 6-digit code to <span className="font-semibold text-mist-50">{formatPhone(sentTo)}</span>.
        </p>
        <TextField
          id="settings-phone-code"
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          value={code}
          error={error || undefined}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="tracking-[0.4em] tabular-nums"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending || code.length !== 6}>
            {pending ? "Checking…" : "Verify"}
          </Button>
          <Button type="button" tone="ghost" size="sm" disabled={pending || wait > 0} onClick={() => void send()}>
            {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
          </Button>
          <Button
            type="button"
            tone="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              setSentTo(null);
              setError("");
            }}
          >
            Change number
          </Button>
          <Button type="button" tone="ghost" size="sm" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    );

  return (
    <form onSubmit={send} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Combobox
          id="settings-phone-country"
          label="Country"
          placeholder="Search countries"
          query={countryQuery}
          onQueryChange={setCountryQuery}
          options={options}
          browse
          browseLabel="All countries"
          value={{ value: country, label: countries.find((option) => option.value === country)?.label ?? country }}
          onChange={(option) => option && setCountry(option.value as CountryCode)}
        />
        <TextField
          id="settings-phone-number"
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={number}
          error={error || undefined}
          onChange={(event) => setNumber(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending || !number.trim()}>
          {pending ? "Sending…" : "Send code"}
        </Button>
        <Button type="button" tone="ghost" size="sm" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <Notice>Standard SMS rates may apply. Your number stays private unless you choose to show it.</Notice>
    </form>
  );
}
