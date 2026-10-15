// --- js/keyboard.js ---
/**
 * Scientific Calculator Pro — Physical Keyboard Controller
 * Maps physical keys to calculator actions without interfering with text/form inputs.
 */
function initKeyboardShortcuts(handlers) {
  window.addEventListener('keydown', (event) => {
    const active = document.activeElement;
    const isExprInput = active && active.id === 'calc-expression-input';
    const isOtherInput =
      active &&
      !isExprInput &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable);

    if (isOtherInput) return;

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

    if (isExprInput) {
      // Let native input handle typing inside the main expression bar
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      handlers.onInsert(event.key);
    } else if (['+', '-', '*', '/', '^', '(', ')', '%'].includes(event.key)) {
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
  initKeyboardShortcuts,
  initKeyboardShortcuts as setupKeyboardShortcuts
};
