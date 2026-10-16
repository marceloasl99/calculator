// --- js/keyboard.js ---
/**
 * Scientific Calculator Pro — Physical Keyboard Controller
 * Maps physical keys to calculator actions without interfering with text/form inputs.
 */
function initKeyboardShortcuts(handlers) {
  window.addEventListener('keydown', (event) => {
    const openModal = document.querySelector('.scp-modal-backdrop:not(.hidden)');
    if (openModal) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (handlers.onCloseModal) handlers.onCloseModal(openModal);
      }
      return;
    }

    if (handlers.isCalculatorActive && !handlers.isCalculatorActive()) return;

    const active = document.activeElement;
    const isExprInput = active && active.id === 'calc-expression-input';
    const isOtherInput =
      active &&
      !isExprInput &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable);

    if (isOtherInput) return;
    if (event.altKey || event.metaKey) return;

    if (event.ctrlKey) {
      const hasSelection = window.getSelection && String(window.getSelection()).length > 0;
      if ((event.key === 'c' || event.key === 'C') && !isExprInput && !hasSelection && handlers.onCopyResult) {
        event.preventDefault();
        handlers.onCopyResult();
      }
      return;
    }

    if (event.key === 'Enter' || event.key === '=') {
      event.preventDefault();
      handlers.onCalculate();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handlers.onClearAll();
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (handlers.onHistoryNavigate) {
        event.preventDefault();
        handlers.onHistoryNavigate(event.key === 'ArrowUp' ? 1 : -1);
      }
      return;
    }

    if (isExprInput) {
      // Let native input handle typing inside the main expression bar
      return;
    }

    if (event.key === '?' && handlers.onHelp) {
      event.preventDefault();
      handlers.onHelp();
    } else if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      handlers.onInsert(event.key);
    } else if (['+', '-', '*', '/', '^', '(', ')', '%', '!'].includes(event.key)) {
      event.preventDefault();
      handlers.onInsert(event.key);
    } else if (event.key === '.' || event.key === ',') {
      event.preventDefault();
      handlers.onInsert('.');
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      handlers.onBackspace();
    } else if (event.key === 'Delete') {
      event.preventDefault();
      handlers.onClearEntry();
    }
  });
}

export {
  initKeyboardShortcuts
};
