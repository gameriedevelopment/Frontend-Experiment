/** Inserts text at the caret (replacing any selection) and puts the caret after it. */
export function insertAtCursor(field: HTMLTextAreaElement | HTMLInputElement | null, value: string, text: string, max?: number) {
  const start = field?.selectionStart ?? value.length;
  const end = field?.selectionEnd ?? value.length;
  const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
  if (max && next.length > max) return value;
  requestAnimationFrame(() => {
    if (!field) return;
    field.focus();
    field.setSelectionRange(start + text.length, start + text.length);
  });
  return next;
}
