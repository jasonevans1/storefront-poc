import { events } from '@dropins/tools/event-bus.js';
import { render as provider } from '@dropins/storefront-cart/render.js';
import * as Cart from '@dropins/storefront-cart/api.js';
import { h } from '@dropins/tools/preact.js';
import {
  InLineAlert,
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';

// Dropin Containers
import CartSummaryList from '@dropins/storefront-cart/containers/CartSummaryList.js';
import OrderSummary from '@dropins/storefront-cart/containers/OrderSummary.js';
import EstimateShipping from '@dropins/storefront-cart/containers/EstimateShipping.js';
import Coupons from '@dropins/storefront-cart/containers/Coupons.js';
import GiftCards from '@dropins/storefront-cart/containers/GiftCards.js';
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { publishShoppingCartViewEvent } from '@dropins/storefront-cart/api.js';

// Modal and Mini PDP
import createMiniPDP from '../../scripts/components/commerce-mini-pdp/commerce-mini-pdp.js';
import createModal from '../modal/modal.js';

// Initializers
import '../../scripts/initializers/cart.js';

import { readBlockConfig } from '../../scripts/aem.js';
import {
  fetchPlaceholders, rootLink, getProductLink,
} from '../../scripts/commerce.js';
import {
  fetchRewardPointsBalance,
  getCartAppliedRewards,
  applyRewardPoints,
  removeRewardPoints,
} from '../../scripts/rewards.js';

export default async function decorate(block) {
  // Configuration
  const {
    'hide-heading': hideHeading = 'false',
    'max-items': maxItems,
    'hide-attributes': hideAttributes = '',
    'enable-item-quantity-update': enableUpdateItemQuantity = 'false',
    'enable-item-remove': enableRemoveItem = 'true',
    'enable-estimate-shipping': enableEstimateShipping = 'false',
    'start-shopping-url': startShoppingURL = '',
    'checkout-url': checkoutURL = '',
    'enable-updating-product': enableUpdatingProduct = 'false',
    'undo-remove-item': undo = 'false',
  } = readBlockConfig(block);

  const placeholders = await fetchPlaceholders();

  const _cart = Cart.getCartDataFromCache();

  // Shared state so the OrderSummary updateLineItems callback can read current reward state
  const rewardLineState = { applied: null };

  // Modal state
  let currentModal = null;
  let currentNotification = null;

  // Layout
  const fragment = document.createRange().createContextualFragment(`
    <div class="cart__notification"></div>
    <div class="cart__wrapper">
      <div class="cart__left-column">
        <div class="cart__list"></div>
      </div>
      <div class="cart__right-column">
        <div class="cart__order-summary"></div>
        <div class="cart__reward-points" hidden></div>
        <div class="cart__gift-options"></div>
      </div>
    </div>

    <div class="cart__empty-cart"></div>
  `);

  const $wrapper = fragment.querySelector('.cart__wrapper');
  const $notification = fragment.querySelector('.cart__notification');
  const $list = fragment.querySelector('.cart__list');
  const $summary = fragment.querySelector('.cart__order-summary');
  const $emptyCart = fragment.querySelector('.cart__empty-cart');
  const $giftOptions = fragment.querySelector('.cart__gift-options');
  const $rightColumn = fragment.querySelector('.cart__right-column');
  const $rewards = fragment.querySelector('.cart__reward-points');

  block.innerHTML = '';
  block.appendChild(fragment);

  // Toggle Empty Cart
  function toggleEmptyCart(_state) {
    $wrapper.removeAttribute('hidden');
    $emptyCart.setAttribute('hidden', '');
  }

  // Handle Edit Button Click
  async function handleEditButtonClick(cartItem) {
    try {
      // Create mini PDP content
      const miniPDPContent = await createMiniPDP(
        cartItem,
        async (_updateData) => {
          // Show success message when mini-PDP updates item
          const productName = cartItem.name
            || cartItem.product?.name
            || placeholders?.Global?.CartUpdatedProductName;
          const message = placeholders?.Global?.CartUpdatedProductMessage?.replace(
            '{product}',
            productName,
          );

          // Clear any existing notifications
          currentNotification?.remove();

          currentNotification = await UI.render(InLineAlert, {
            heading: message,
            type: 'success',
            variant: 'primary',
            icon: h(Icon, { source: 'CheckWithCircle' }),
            'aria-live': 'assertive',
            role: 'alert',
            onDismiss: () => {
              currentNotification?.remove();
            },
          })($notification);

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            currentNotification?.remove();
          }, 5000);
        },
        () => {
          if (currentModal) {
            currentModal.removeModal();
            currentModal = null;
          }
        },
      );

      // Create and show modal
      currentModal = await createModal([miniPDPContent]);

      if (currentModal.block) {
        currentModal.block.setAttribute('id', 'mini-pdp-modal');
      }

      currentModal.showModal();
    } catch (error) {
      console.error('Error opening mini PDP modal:', error);

      // Clear any existing notifications
      currentNotification?.remove();

      // Show error notification
      currentNotification = await UI.render(InLineAlert, {
        heading: placeholders?.Global?.ProductLoadError,
        type: 'error',
        variant: 'primary',
        icon: h(Icon, { source: 'AlertWithCircle' }),
        'aria-live': 'assertive',
        role: 'alert',
        onDismiss: () => {
          currentNotification?.remove();
        },
      })($notification);
    }
  }

  // Render Containers
  const createProductLink = (product) => getProductLink(product.url.urlKey, product.topLevelSku);
  await Promise.all([
    // Cart List
    provider.render(CartSummaryList, {
      hideHeading: hideHeading === 'true',
      routeProduct: createProductLink,
      routeEmptyCartCTA: startShoppingURL ? () => rootLink(startShoppingURL) : undefined,
      maxItems: parseInt(maxItems, 10) || undefined,
      attributesToHide: hideAttributes
        .split(',')
        .map((attr) => attr.trim().toLowerCase()),
      enableUpdateItemQuantity: enableUpdateItemQuantity === 'true',
      enableRemoveItem: enableRemoveItem === 'true',
      undo: undo === 'true',
      slots: {
        Thumbnail: (ctx) => {
          const { item, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = createProductLink(item);

          tryRenderAemAssetsImage(ctx, {
            alias: item.sku,
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,

            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });
        },

        Footer: (ctx) => {
          // Edit Link
          if (ctx.item?.itemType === 'ConfigurableCartItem' && enableUpdatingProduct === 'true') {
            const editLink = document.createElement('div');
            editLink.className = 'cart-item-edit-link';

            UI.render(Button, {
              children: placeholders?.Global?.CartEditButton,
              variant: 'tertiary',
              size: 'medium',
              icon: h(Icon, { source: 'Edit' }),
              onClick: () => handleEditButtonClick(ctx.item),
            })(editLink);

            ctx.appendChild(editLink);
          }

          // Gift Options
          const giftOptions = document.createElement('div');

          provider.render(GiftOptions, {
            item: ctx.item,
            view: 'product',
            dataSource: 'cart',
            handleItemsLoading: ctx.handleItemsLoading,
            handleItemsError: ctx.handleItemsError,
            onItemUpdate: ctx.onItemUpdate,
            slots: {
              SwatchImage: swatchImageSlot,
            },
          })(giftOptions);

          ctx.appendChild(giftOptions);
        },
      },
    })($list),

    // Order Summary
    provider.render(OrderSummary, {
      routeProduct: createProductLink,
      routeCheckout: checkoutURL ? () => rootLink(checkoutURL) : undefined,
      updateLineItems: (lineItems) => {
        if (!rewardLineState.applied?.points) return lineItems;
        const formatted = new Intl.NumberFormat(undefined, {
          style: 'currency', currency: rewardLineState.applied.money.currency,
        }).format(rewardLineState.applied.money.value);
        const rewardLine = {
          key: 'rewardPointsDiscount',
          sortOrder: 650,
          content: h(
            'div',
            { className: 'cart-order-summary__entry cart-order-summary__discount' },
            h('span', { className: 'cart-order-summary__label' }, placeholders?.Global?.RewardsTitle || 'Reward Points'),
            h('span', { className: 'cart-order-summary__price' }, `-${formatted}`),
          ),
        };
        return [...lineItems, rewardLine];
      },
      slots: {
        EstimateShipping: async (ctx) => {
          if (enableEstimateShipping === 'true') {
            const wrapper = document.createElement('div');
            await provider.render(EstimateShipping, {})(wrapper);
            ctx.replaceWith(wrapper);
          }
        },
        Coupons: (ctx) => {
          const coupons = document.createElement('div');

          provider.render(Coupons)(coupons);

          ctx.appendChild(coupons);
        },
        GiftCards: (ctx) => {
          const giftCards = document.createElement('div');

          provider.render(GiftCards)(giftCards);

          ctx.appendChild(giftCards);
        },
      },
    })($summary),

    provider.render(GiftOptions, {
      view: 'order',
      dataSource: 'cart',

      slots: {
        SwatchImage: swatchImageSlot,
      },
    })($giftOptions),
  ]);

  // Rewards Section
  async function initRewardsSection($container) {
    const cartData = Cart.getCartDataFromCache();
    const cartId = cartData?.id;
    if (!cartId) return;

    const [balance, appliedRewards] = await Promise.all([
      fetchRewardPointsBalance(),
      getCartAppliedRewards(cartId),
    ]);

    if (!balance || balance.points === 0) {
      $container.setAttribute('hidden', '');
      return;
    }

    let isApplied = !!(appliedRewards?.points);

    // Sync OrderSummary line on initial load
    rewardLineState.applied = isApplied ? appliedRewards : null;
    if (isApplied) {
      // Re-emit cached cart data so updateLineItems runs with the correct state
      events.emit('cart/data', cartData);
    }

    $container.innerHTML = '';
    const $section = document.createElement('div');
    $section.className = 'cart__rewards-section';

    const $header = document.createElement('p');
    $header.className = 'cart__rewards-header';
    $header.textContent = placeholders?.Global?.RewardsTitle || 'Reward Points';

    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency', currency: balance.money.currency,
    }).format(balance.money.value);
    const $balance = document.createElement('p');
    $balance.className = 'cart__rewards-balance';
    $balance.textContent = `${Math.floor(balance.points).toLocaleString()} points available (${formatted})`;

    const $applied = document.createElement('p');
    $applied.className = 'cart__rewards-applied';
    $applied.hidden = true;

    const $error = document.createElement('p');
    $error.className = 'cart__rewards-error';
    $error.hidden = true;

    const $buttonWrapper = document.createElement('div');
    $buttonWrapper.className = 'cart__rewards-action';

    $section.append($header, $balance, $applied, $error, $buttonWrapper);
    $container.appendChild($section);
    $container.removeAttribute('hidden');

    function updateAppliedDisplay(rewardData) {
      if (rewardData?.points) {
        const appliedFormatted = new Intl.NumberFormat(undefined, {
          style: 'currency', currency: rewardData.money.currency,
        }).format(rewardData.money.value);
        $applied.textContent = `${placeholders?.Global?.RewardsAppliedLabel || 'Applied'}: -${appliedFormatted} (${Math.floor(rewardData.points)} pts)`;
        $applied.hidden = false;
      } else {
        $applied.hidden = true;
      }
    }

    // Show initial applied state
    if (isApplied && appliedRewards) {
      updateAppliedDisplay(appliedRewards);
    }

    let buttonInstance = null;
    async function renderButton(applied, loading = false) {
      const label = applied
        ? (placeholders?.Global?.RewardsRemoveButton || 'Remove Reward Points')
        : (placeholders?.Global?.RewardsApplyButton || 'Apply Reward Points');

      if (buttonInstance) {
        buttonInstance.setProps((prev) => ({ ...prev, children: label, disabled: loading }));
      } else {
        buttonInstance = await UI.render(Button, {
          children: label,
          variant: 'secondary',
          disabled: loading,
          onClick: async () => {
            $error.hidden = true;
            renderButton(isApplied, true);
            try {
              if (isApplied) {
                await removeRewardPoints(cartId);
                isApplied = false;
                rewardLineState.applied = null;
                updateAppliedDisplay(null);
              } else {
                const result = await applyRewardPoints(cartId);
                isApplied = true;
                rewardLineState.applied = result;
                updateAppliedDisplay(result);
              }
              renderButton(isApplied, false);
              await Cart.refreshCart();
            } catch (err) {
              $error.textContent = err.message || (placeholders?.Global?.RewardsError || 'Something went wrong. Please try again.');
              $error.hidden = false;
              renderButton(isApplied, false);
            }
          },
        })($buttonWrapper);
      }
    }

    await renderButton(isApplied);
  }

  events.on(
    'authenticated',
    (isAuthenticated) => {
      if (isAuthenticated) {
        initRewardsSection($rewards);
      } else {
        $rewards.setAttribute('hidden', '');
        $rewards.innerHTML = '';
      }
    },
    { eager: true },
  );

  let cartViewEventPublished = false;
  // Events
  events.on(
    'cart/data',
    (cartData) => {
      toggleEmptyCart(isCartEmpty(cartData));

      const isEmpty = !cartData || cartData.totalQuantity < 1;
      $giftOptions.style.display = isEmpty ? 'none' : '';
      $rightColumn.style.display = isEmpty ? 'none' : '';

      if (!cartViewEventPublished) {
        cartViewEventPublished = true;
        publishShoppingCartViewEvent();
      }
    },
    { eager: true },
  );

  return Promise.resolve();
}

function isCartEmpty(cart) {
  return cart ? cart.totalQuantity < 1 : true;
}

function swatchImageSlot(ctx) {
  const { imageSwatchContext, defaultImageProps } = ctx;
  tryRenderAemAssetsImage(ctx, {
    alias: imageSwatchContext.label,
    imageProps: defaultImageProps,
    wrapper: document.createElement('span'),

    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  });
}
