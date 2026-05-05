import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';

export async function fetchDeliveryFee(country, region, subtotal, currency) {
  const baseUrl = getConfigValue('app-builder-calculate-url');
  if (!baseUrl || !country) return { fee: 0, name: null, currency: currency ?? 'USD' };
  try {
    const params = new URLSearchParams({
      country,
      region: region ?? '',
      subtotal: String(subtotal ?? 0),
      currency: currency ?? 'USD',
    });
    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) return { fee: 0, name: null, currency: currency ?? 'USD' };
    const data = await response.json();
    return { fee: data.fee ?? 0, name: data.name ?? null, currency: currency ?? 'USD' };
  } catch {
    return { fee: 0, name: null, currency: currency ?? 'USD' };
  }
}
