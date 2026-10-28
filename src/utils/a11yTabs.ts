import React from "react";

/**
 * Utilitário de navegação por teclado para componentes de Abas (WAI-ARIA Tab Pattern).
 * Suporta navegação pelas setas (Direita/Esquerda/Cima/Baixo), Home e End.
 * Pode ser chamado de forma dirigida por estado (passando tabs, currentSelected e onSelect)
 * ou de forma direta pelo DOM (passando seletor).
 */
export function handleTabKeyDown<T extends string = string>(
  e: React.KeyboardEvent<HTMLElement>,
  tabsOrSelector?: readonly T[] | T[] | string,
  currentSelected?: T,
  onSelect?: (tab: T) => void
): void {
  // Modo 1: Baseado em estado e lista de identificadores
  if (Array.isArray(tabsOrSelector) && currentSelected !== undefined && onSelect) {
    const tabs = tabsOrSelector;
    const currentIndex = tabs.indexOf(currentSelected);
    if (currentIndex === -1) return;

    let targetIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = tabs.length - 1;
    }

    if (targetIndex !== -1) {
      const targetTab = tabs[targetIndex];
      onSelect(targetTab);
      const currentTarget = e.currentTarget;
      const tablist = currentTarget.closest('[role="tablist"]');
      if (tablist) {
        const tabButtons = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        if (tabButtons[targetIndex]) {
          tabButtons[targetIndex].focus();
        }
      }
    }
    return;
  }

  // Modo 2: Descoberta e ativação automática via DOM
  const selector = typeof tabsOrSelector === "string" ? tabsOrSelector : '[role="tab"]';
  const tablist = e.currentTarget.closest('[role="tablist"]') || e.currentTarget;
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>(selector));
  if (tabs.length === 0) return;

  const currentTab = (document.activeElement as HTMLButtonElement) || e.target;
  let currentIndex = tabs.indexOf(currentTab as HTMLButtonElement);
  if (currentIndex === -1) {
    currentIndex = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  }
  if (currentIndex === -1) currentIndex = 0;

  let targetIndex = -1;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    targetIndex = (currentIndex + 1) % tabs.length;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (e.key === "Home") {
    e.preventDefault();
    targetIndex = 0;
  } else if (e.key === "End") {
    e.preventDefault();
    targetIndex = tabs.length - 1;
  }

  if (targetIndex !== -1 && tabs[targetIndex]) {
    tabs[targetIndex].focus();
    tabs[targetIndex].click();
  }
}
