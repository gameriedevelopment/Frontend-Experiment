export const activeNavigationEvent = "gamerie:active-navigation";

export type ActiveNavigationDetail = {
  href: string;
};

export function isCurrentNavigationTarget(href: string, pathname: string): boolean {
  return href === pathname;
}

export function announceActiveNavigation(href: string): void {
  window.dispatchEvent(
    new CustomEvent<ActiveNavigationDetail>(activeNavigationEvent, {
      detail: { href },
    }),
  );
}
