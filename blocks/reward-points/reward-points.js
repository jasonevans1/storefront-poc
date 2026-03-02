import { events } from '@dropins/tools/event-bus.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { fetchRewardPointsBalance } from '../../scripts/rewards.js';

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();

  const titleText = placeholders?.Global?.RewardsTitle || 'Reward Points';
  const labelText = placeholders?.Global?.RewardsCurrentPointsLabel || 'Current Reward Points';
  const errorText = placeholders?.Global?.RewardsError || 'Unable to load reward points balance';

  block.innerHTML = '';

  const $wrapper = document.createElement('div');
  $wrapper.className = 'reward-points__wrapper';
  $wrapper.setAttribute('hidden', '');

  const $title = document.createElement('h2');
  $title.className = 'reward-points__title';
  $title.textContent = titleText;

  const $balance = document.createElement('p');
  $balance.className = 'reward-points__balance';

  $wrapper.append($title, $balance);
  block.appendChild($wrapper);

  events.on(
    'authenticated',
    async (isAuthenticated) => {
      if (!isAuthenticated) {
        $wrapper.setAttribute('hidden', '');
        return;
      }

      const balance = await fetchRewardPointsBalance();

      if (balance === null) {
        $balance.textContent = errorText;
      } else {
        $balance.textContent = `${labelText}: ${Math.floor(balance.points).toLocaleString()}`;
      }
      $wrapper.removeAttribute('hidden');
    },
    { eager: true },
  );
}
