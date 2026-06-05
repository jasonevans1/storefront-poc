import { getRootPath, isMultistore } from '@dropins/tools/lib/aem/configs.js';
// Dropin Components
import {
  Button,
  provider as UI,
} from '@dropins/tools/components.js';

// Block-level
import createModal from '../modal/modal.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Toggles all storeSelector sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleStoreDropdown(sections, expanded = false) {
  sections
    .querySelectorAll('.storeview-modal .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Progressively enhances the footer content columns into an accessible
 * accordion on small viewports. The authored fragment markup is never
 * changed: trigger buttons and panel wrappers are created at runtime.
 *
 * - Each column heading becomes a real <button> (aria-expanded / aria-controls).
 * - Panels animate via grid-template-rows (no height measurement, no reflow loop).
 * - Collapsed content is removed from the a11y tree and tab order (visibility).
 * - Above the breakpoint the columns render normally and the triggers are
 *   disabled, so they are inert and skipped by keyboard and screen readers.
 * - prefers-reduced-motion is honoured (handled in CSS).
 *
 * @param {Element} block The footer block element
 */
function enhanceFooterAccordion(block) {
  const $columns = block.querySelector('.columns-3-cols');
  if (!$columns) return;

  const $row = $columns.querySelector(':scope > div');
  if (!$row) return;

  const items = [...$row.children].map(($col, index) => {
    const $heading = $col.querySelector('h2, h3, h4, h5, h6');
    if (!$heading) return null;

    // Move everything after the heading into an animatable panel.
    const $panel = document.createElement('div');
    $panel.className = 'footer-acc-panel is-closed';
    $panel.id = `footer-acc-panel-${index}`;
    const $inner = document.createElement('div');
    $inner.className = 'footer-acc-panel-inner';
    while ($heading.nextSibling) $inner.append($heading.nextSibling);
    $panel.append($inner);
    $col.append($panel);

    // Replace the heading text with a real button trigger.
    const $button = document.createElement('button');
    $button.type = 'button';
    $button.className = 'footer-acc-trigger';
    $button.setAttribute('aria-controls', $panel.id);
    const $label = document.createElement('span');
    $label.className = 'footer-acc-label';
    $label.textContent = $heading.textContent.trim();
    const $chevron = document.createElement('span');
    $chevron.className = 'footer-acc-chevron';
    $chevron.setAttribute('aria-hidden', 'true');
    $button.append($label, $chevron);
    $heading.textContent = '';
    $heading.append($button);

    return { $button, $panel };
  }).filter(Boolean);

  if (!items.length) return;

  const openItem = ($item) => {
    $item.$button.setAttribute('aria-expanded', 'true');
    $item.$panel.classList.remove('is-closed');
  };

  const closeItem = ($item) => {
    $item.$button.setAttribute('aria-expanded', 'false');
    $item.$panel.classList.add('is-closed');
  };

  items.forEach(($item) => {
    $item.$button.addEventListener('click', () => {
      const expanded = $item.$button.getAttribute('aria-expanded') === 'true';
      if (expanded) closeItem($item); else openItem($item);
    });
  });

  const desktop = window.matchMedia('(min-width: 900px)');

  const applyMode = () => {
    if (desktop.matches) {
      // Desktop: static columns, triggers inert (non-interactive, untabbable).
      block.classList.remove('footer-accordion');
      items.forEach(($item) => {
        $item.$button.disabled = true;
        $item.$button.removeAttribute('aria-expanded');
        $item.$panel.classList.remove('is-closed');
      });
    } else {
      // Small viewports: collapse into an accordion with the first item open.
      block.classList.add('footer-accordion');
      items.forEach(($item, index) => {
        $item.$button.disabled = false;
        if (index === 0) openItem($item); else closeItem($item);
      });
    }
  };

  applyMode();
  desktop.addEventListener('change', applyMode);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const root = getRootPath();
  // Load Footer as Fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');

  // Footer content - Store Switcher
  if (isMultistore()) {
    footer.innerHTML = `
      <div class="storeview-switcher-button"></div>
    `;

    // Container and component refs
    let modal;

    // Modal Actions
    const showModal = async (content) => {
      modal = await createModal([content]);
      modal.showModal();
    };

    // Rendering the Store Switcher Modal Content
    const $storeSwitcherBtn = footer.querySelector(
      '.storeview-switcher-button',
    );

    // Store Switcher Modal Content
    const storeSwitcherPath = '/store-switcher';
    let fragmentStoreView;

    try {
      fragmentStoreView = await loadFragment(storeSwitcherPath);
      if (!fragmentStoreView) throw new Error(`Footer does not render due to Store Switcher fragment (${storeSwitcherPath}) not found`);
    } catch (error) {
      console.error('Error loading store switcher fragment:', error);
      return;
    }

    // Store Switcher Modal Content
    const storeSwitcher = document.createElement('div');

    // Return Storename from stores-switcher
    const selected = [...fragmentStoreView.querySelectorAll('a')].find((a) => {
      const url = new URL(a.href);
      return url.pathname.startsWith(root);
    });

    storeSwitcher.id = 'storeview-modal';
    while (fragmentStoreView.firstElementChild) {
      storeSwitcher.append(fragmentStoreView.firstElementChild);
    }

    // create classes for storeview modal sections
    const classes = ['storeview-title', 'storeview-list'];
    classes.forEach((c, i) => {
      const section = storeSwitcher.children[i];
      if (section) section.classList.add(`storeview-modal-${c}`);
    });

    // Store Switcher Modal Content - Store View Title
    const storeViewTitle = storeSwitcher.querySelector('.storeview-modal-storeview-title');
    const title = storeViewTitle.querySelector('h3');
    if (title) {
      title.className = '';
      title.closest('h3').classList.add('storeview-modal-storeview-title');
      title.setAttribute('tabindex', '0');
    }

    // Storeview List
    const storeViewList = storeSwitcher.querySelector('.storeview-modal-storeview-list');

    if (storeViewList && storeViewList.children.length) {
      // Add storeview-selection class to parent UL
      storeViewList
        .querySelectorAll(':scope .default-content-wrapper > ul')
        .forEach((storeView) => {
          if (storeView.querySelector('ul')) storeView.classList.add('storeview-selection');
        });

      // if multiple stores exist per region, add class storeviews and click events for accordion
      storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
        if (storeRegion.children.length > 1) {
          if (storeRegion.querySelector('ul')) storeRegion.classList.add('storeviews');

          // Accessiblity: addeventlistener for 'click' and keyboard event and tab indexes
          storeViewList.querySelectorAll(':scope li').forEach((storeView) => {
            const link = storeView.closest('a');
            if (link) link.setAttribute('tabindex', '0');
            storeView.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const expanded = storeView.getAttribute('aria-expanded') === 'true';
                toggleStoreDropdown(storeViewList);
                storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
              }
            });
            storeView.addEventListener('click', () => {
              const expanded = storeView.getAttribute('aria-expanded') === 'true';
              toggleStoreDropdown(storeViewList);
              storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            });
          });
        }
      });

      // If only one storeview link in region, convert parent UL into the li and remove the child UL
      storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
        const li = storeRegion.closest('li');

        if (storeRegion.children.length <= 1) {
          li.classList.add('storeview-single-store');
          const ulParent = li.closest('ul');
          const replacedChild = (storeRegion.firstElementChild);
          replacedChild.className = 'storeview-single-store';

          ulParent.replaceChild(replacedChild, li);
          ulParent.setAttribute('tabindex', '0');
        } else {
          li.classList.add('storeview-multiple-stores');
          li.setAttribute('tabindex', '0');
        }
      });

      UI.render(Button, {
        children: `${selected.text}`,
        'data-testid': 'storeview-switcher-button',
        className: 'storeview-switcher-button',
        size: 'medium',
        variant: 'teritary',
        onClick: () => {
          showModal(storeSwitcher);
        },
      })($storeSwitcherBtn);
    }
  }
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);

  // Progressive enhancement: collapse content columns into an accordion on
  // small viewports. Safe no-op if the expected column block is absent.
  enhanceFooterAccordion(block);
}
