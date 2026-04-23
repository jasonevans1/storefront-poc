import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';

/**
 * Fetches delivery fee from the App Builder calculate action.
 *
 * @param {Object} params
 * @param {string} params.country - Shipping country code
 * @param {string} [params.region] - Shipping region code
 * @param {number} params.subtotal - Cart subtotal excluding tax
 * @param {string} params.currency - Currency code (e.g. 'USD')
 * @returns {Promise<{amount: number, label: string, currency: string}|null>}
 */
export async function fetchDeliveryFee({
  country,
  region,
  subtotal,
  currency,
} = {}) {
  if (!country) {
    return null;
  }

  const calculateUrl = getConfigValue('delivery-fee-calculate-url');

  let url;
  try {
    url = new URL(calculateUrl);
  } catch {
    console.warn('delivery-fee: invalid calculate URL', calculateUrl);
    return null;
  }

  url.searchParams.set('country', country);
  if (region) url.searchParams.set('region', region);
  url.searchParams.set('subtotal', subtotal);
  url.searchParams.set('currency', currency);

  let response;
  try {
    response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    console.warn('delivery-fee: calculate endpoint call failed', err);
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.warn('delivery-fee: failed to parse calculate response', err);
    return null;
  }

  const fee = Number(data.fee);
  if (fee === 0) {
    return null;
  }

  return {
    amount: fee,
    label: data.name,
    currency: data.currency,
  };
}

/**
 * Extracts delivery fee parameters from a CartModel object.
 *
 * @param {Object} cartData - CartModel data from the cart dropin
 * @returns {{country: string, region: string|undefined, subtotal: number, currency: string}|null}
 */
export function getDeliveryFeeParams(cartData) {
  const country = cartData?.addresses?.shipping?.[0]?.countryCode;
  if (!country) {
    return null;
  }

  const region = cartData?.addresses?.shipping?.[0]?.regionCode;
  const subtotal = cartData?.subtotal?.excludingTax?.value;
  const currency = cartData?.subtotal?.excludingTax?.currency;

  return {
    country,
    region,
    subtotal,
    currency,
  };
}
