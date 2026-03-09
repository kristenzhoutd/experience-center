/**
 * Preview Injection Script — generates JavaScript for webview.executeJavaScript()
 * to inject personalized content into the live website preview.
 *
 * The generated script is idempotent: it cleans up previous injections before
 * re-injecting, enabling variant switching without page reload.
 */

export interface InjectionSpot {
  selector: string;
  html: string;
  css: string;
  spotName: string;
}

/**
 * Build a JavaScript string that, when executed in a webview, injects
 * personalized content at the given CSS selectors.
 *
 * Returns JSON: { injectedCount: number, missingSelectors: string[] }
 */
export function buildInjectionScript(
  spots: InjectionSpot[],
  baseCss: string,
): string {
  const spotsJson = JSON.stringify(spots);
  const baseCssJson = JSON.stringify(baseCss);

  return `(function() {
  var spots = ${spotsJson};
  var baseCss = ${baseCssJson};

  // 1. Clean up previous injections
  var oldStyles = document.querySelectorAll('style[data-ps-preview]');
  for (var i = 0; i < oldStyles.length; i++) {
    oldStyles[i].parentNode.removeChild(oldStyles[i]);
  }
  // Remove badges
  var oldBadges = document.querySelectorAll('.ps-preview-badge');
  for (var i = 0; i < oldBadges.length; i++) {
    oldBadges[i].parentNode.removeChild(oldBadges[i]);
  }
  // Unwrap legacy wrappers (from previous injection approach)
  var oldWrappers = document.querySelectorAll('.ps-preview-wrapper');
  for (var i = 0; i < oldWrappers.length; i++) {
    var w = oldWrappers[i];
    var parent = w.parentNode;
    while (w.firstChild) {
      if (w.firstChild.nodeType === 1 && w.firstChild.classList && w.firstChild.classList.contains('ps-preview-badge')) {
        w.removeChild(w.firstChild);
      } else {
        parent.insertBefore(w.firstChild, w);
      }
    }
    parent.removeChild(w);
  }
  var highlighted = document.querySelectorAll('.ps-preview-highlight');
  for (var i = 0; i < highlighted.length; i++) {
    highlighted[i].classList.remove('ps-preview-highlight');
    highlighted[i].style.removeProperty('position');
    highlighted[i].style.removeProperty('overflow');
    highlighted[i].style.removeProperty('outline');
    highlighted[i].style.removeProperty('outline-offset');
    // Restore original content if stored
    if (highlighted[i].hasAttribute('data-ps-original')) {
      highlighted[i].innerHTML = highlighted[i].getAttribute('data-ps-original');
      highlighted[i].removeAttribute('data-ps-original');
    }
  }

  // 2. Inject content per spot
  var injectedCount = 0;
  var missingSelectors = [];
  var allCss = '';

  for (var s = 0; s < spots.length; s++) {
    var spot = spots[s];
    var el = null;
    try { el = document.querySelector(spot.selector); } catch(e) {}

    if (!el) {
      missingSelectors.push(spot.selector);
      continue;
    }

    // Store original innerHTML on first injection only
    if (!el.hasAttribute('data-ps-original')) {
      el.setAttribute('data-ps-original', el.innerHTML);
    }

    // Replace content
    el.innerHTML = spot.html;
    el.classList.add('ps-preview-highlight');

    // Apply highlight styles inline (don't rely on <style> tag)
    el.style.setProperty('position', 'relative', 'important');
    el.style.setProperty('overflow', 'visible', 'important');
    el.style.setProperty('outline', '2px dashed #6366f1', 'important');
    el.style.setProperty('outline-offset', '2px', 'important');

    // Add spot name badge directly inside el, with all styles inline
    var badge = document.createElement('div');
    badge.className = 'ps-preview-badge';
    badge.textContent = spot.spotName;
    badge.setAttribute('style',
      'position:absolute!important;top:0!important;right:0!important;' +
      'transform:translateY(-100%)!important;margin-top:-4px!important;' +
      'background:#6366f1!important;color:#fff!important;' +
      'font-size:10px!important;font-weight:600!important;' +
      'padding:2px 8px!important;border-radius:4px!important;' +
      'z-index:10000!important;font-family:system-ui,sans-serif!important;' +
      'line-height:1.4!important;pointer-events:none!important;' +
      'white-space:nowrap!important;box-sizing:border-box!important;' +
      'display:block!important;width:auto!important;height:auto!important;' +
      'margin-bottom:0!important;margin-left:0!important;margin-right:0!important;' +
      'float:none!important;clear:none!important;' +
      'text-align:left!important;text-decoration:none!important;' +
      'text-transform:none!important;letter-spacing:normal!important;' +
      'border:none!important;outline:none!important;' +
      'min-width:0!important;max-width:none!important;' +
      'min-height:0!important;max-height:none!important;' +
      'opacity:1!important;visibility:visible!important;' +
      'overflow:visible!important;'
    );
    el.appendChild(badge);

    // Accumulate per-spot CSS scoped under the selector
    if (spot.css) {
      allCss += '\\n/* Spot: ' + spot.spotName + ' */\\n';
      // Scope each rule under the spot selector for specificity
      var rules = spot.css.split('}');
      for (var r = 0; r < rules.length; r++) {
        var rule = rules[r].trim();
        if (!rule) continue;
        // Check if it's a media query or @-rule
        if (rule.indexOf('@') === 0) {
          allCss += rule + '}\\n';
        } else {
          allCss += spot.selector + ' ' + rule + '}\\n';
        }
      }
    }

    injectedCount++;
  }

  // 3. Inject consolidated CSS
  var style = document.createElement('style');
  style.setAttribute('data-ps-preview', 'true');
  style.textContent = baseCss + '\\n' + allCss + '\\n' +
    '.ps-preview-highlight {' +
    '  outline: 2px dashed #6366f1 !important;' +
    '  outline-offset: 2px !important;' +
    '}' +
    '.ps-preview-badge {' +
    '  position: absolute !important;' +
    '  top: 0 !important;' +
    '  right: 0 !important;' +
    '  transform: translateY(-100%) !important;' +
    '  margin-top: -4px !important;' +
    '  background: #6366f1 !important;' +
    '  color: #fff !important;' +
    '  font-size: 10px !important;' +
    '  font-weight: 600 !important;' +
    '  padding: 2px 8px !important;' +
    '  border-radius: 4px !important;' +
    '  z-index: 10000 !important;' +
    '  font-family: system-ui, sans-serif !important;' +
    '  line-height: 1.4 !important;' +
    '  pointer-events: none !important;' +
    '  white-space: nowrap !important;' +
    '}';
  document.head.appendChild(style);

  // 4. Return result
  return JSON.stringify({ injectedCount: injectedCount, missingSelectors: missingSelectors });
})();`;
}
