// Global hover-tooltip utility
// Call `initHoverTooltip()` once on app startup (e.g., in +layout.svelte)

export function initHoverTooltip(options = {}) {
  const offset = options.offset || 12;
  const showClass = options.showClass || 'hover-tooltip';
  let tooltip = null;

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.className = 'global-hover-tooltip';
    tooltip.style.fontFamily = "'Heebo', sans-serif";
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = 10000;
    tooltip.style.background = 'rgba(35,49,102,0.85)';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '6px 8px';
    tooltip.style.borderRadius = '50px';
    tooltip.style.fontSize = '0.85rem';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s ease';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.dataset.visible = 'false';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function showTooltip(text, x, y) {
    const t = ensureTooltip();
    t.textContent = text;
    t.style.left = (x + offset) + 'px';
    t.style.top = (y + offset) + 'px';
    t.style.transform = 'translateY(0)';
    t.style.opacity = '1';
    t.dataset.visible = 'true';
  }

  function moveTooltip(x, y) {
    if (!tooltip || tooltip.dataset.visible !== 'true') return;
    tooltip.style.left = (x + offset) + 'px';
    tooltip.style.top = (y + offset) + 'px';
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.style.opacity = '0';
    tooltip.dataset.visible = 'false';
  }

  function findTooltipText(target) {
    if (!target) return '';
    // prefer data-tooltip, then title attribute, then alt (for images), then aria-label
    return (
      target.dataset && target.dataset.tooltip ||
      target.getAttribute && target.getAttribute('title') ||
      (target.alt || '') ||
      target.getAttribute && target.getAttribute('aria-label') ||
      ''
    );
  }

  let currentTarget = null;

  function onMouseOver(e) {
    const el = e.target.closest ? e.target.closest('.' + showClass) : findClosestByClass(e.target, showClass);
    if (el) {
      currentTarget = el;
      const text = el.dataset && el.dataset.tooltip ? el.dataset.tooltip : (el.getAttribute ? el.getAttribute('title') : '') || '';
      if (!text) {
        // if element itself has no tooltip, check first child img's alt
        const img = el.querySelector && el.querySelector('img');
        if (img && img.alt) text = img.alt;
      }
      if (text) showTooltip(text, e.clientX, e.clientY);
    }
  }

  function onMouseMove(e) {
    if (!currentTarget) return;
    moveTooltip(e.clientX, e.clientY);
  }

  function onMouseOut(e) {
    // if leaving the current target entirely
    if (!currentTarget) return;
    const related = e.relatedTarget;
    if (related && currentTarget.contains(related)) return;
    currentTarget = null;
    hideTooltip();
  }

  // helper for older envs without closest
  function findClosestByClass(node, className) {
    while (node && node !== document) {
      if (node.classList && node.classList.contains(className)) return node;
      node = node.parentNode;
    }
    return null;
  }

  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseout', onMouseOut);

  // return teardown function
  return function destroy() {
    document.removeEventListener('mouseover', onMouseOver);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseout', onMouseOut);
    if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    tooltip = null;
    currentTarget = null;
  };
}
