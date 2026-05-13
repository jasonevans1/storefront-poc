import { fetchPlaceholders } from '../../scripts/commerce.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

const svgArrowLeft = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgArrowRight = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let duration = 6000;

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const btn = indicator.querySelector('button');
    if (idx !== slideIndex) {
      btn.removeAttribute('disabled');
      indicator.removeAttribute('data-active');
    } else {
      btn.setAttribute('disabled', 'true');
      indicator.setAttribute('data-active', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide
    .querySelectorAll('a')
    .forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function goToRelativeSlide(block, direction) {
  const slides = block.querySelectorAll('.carousel-slide');
  if (slides.length < 2) return;

  const currentIndex = parseInt(block.dataset.activeSlide || '0', 10);
  const nextIndex = (currentIndex + direction + slides.length) % slides.length;

  showSlide(block, nextIndex);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');

  // Indicator clicks
  if (slideIndicators) {
    slideIndicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const slideIndicator = e.currentTarget.parentElement;
        showSlide(
          block,
          parseInt(slideIndicator.dataset.targetSlide, 10),
        );
      });
    });
  }

  // Arrow buttons
  block.querySelector('.carousel-prev')?.addEventListener('click', () => {
    goToRelativeSlide(block, -1);
  });

  block.querySelector('.carousel-next')?.addEventListener('click', () => {
    goToRelativeSlide(block, 1);
  });

  // Keyboard navigation
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToRelativeSlide(block, -1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToRelativeSlide(block, 1);
    }
  });

  const slideObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) updateActiveSlide(entry.target);
      });
    },
    { threshold: 0.5 },
  );

  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function startAutoplay(block, interval = 6000) {
  if (interval !== 0) {
    const slides = block.querySelectorAll('.carousel-slide');

    if (slides.length < 2) return;
    let currentIndex = parseInt(block.dataset.activeSlide || '0', 10);
    setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      showSlide(block, nextIndex);
      currentIndex = nextIndex;
    }, interval);
  }
}

function createSlide(row, slideIndex, carouselId) {
  const columns = Array.from(row.querySelectorAll(':scope > div'));

  if (columns.length >= 2) {
    const key = columns[0].innerText.trim().toLowerCase();
    const value = columns[1].innerText.trim();

    // Config Row: duration
    if (key === 'duration') {
      const parsed = parseInt(value, 10);

      if (!Number.isNaN(parsed)) {
        duration = parsed;
      }

      return null;
    }
    // Slide Row
    if (key === 'slide') {
      const slide = document.createElement('li');
      slide.dataset.slideIndex = slideIndex;
      slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
      slide.classList.add('carousel-slide');

      if (columns[1]) {
        const contentColumn = columns[1];

        if (contentColumn) {
          contentColumn.classList.add('carousel-slide-content');
          const pictureParagraphs = contentColumn.querySelectorAll('p > picture');
          pictureParagraphs.forEach((picture) => {
            const p = picture.parentElement;
            const img = picture.querySelector('img');
            const shouldEagerLoad = slideIndex === 0;
            p.replaceWith(createOptimizedPicture(img.src, img.alt, shouldEagerLoad, [{ width: '2000' }]));
          });
          slide.append(contentColumn);
        }

        const heading = contentColumn.querySelector('h2');
        const bodyParagraphs = contentColumn.querySelectorAll('p:not(:has(> picture))');
        const buttonContainer = contentColumn.querySelector('.button-container');

        if (heading || buttonContainer || bodyParagraphs.length) {
          const textWrapper = document.createElement('div');
          textWrapper.classList.add('carousel-slide-content_text');
          if (heading) {
            textWrapper.append(heading);
          }
          if (buttonContainer) {
            textWrapper.append(buttonContainer);
          }
          if (bodyParagraphs.length) {
            bodyParagraphs.forEach((p) => textWrapper.append(p));
          }
          contentColumn.append(textWrapper);
        }

        const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
        if (labeledBy) {
          slide.setAttribute('aria-labelledby', labeledBy.id);
        }
      }

      return slide;
    }
  }
  return null;
}

let carouselId = 0;

export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = Array.from(block.querySelectorAll(':scope > div'));
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('tabindex', '0');
  block.setAttribute(
    'aria-roledescription',
    placeholders.carousel || 'Carousel',
  );

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;

  if (!isSingleSlide) {
    // Previous button — lives inside the slides container, vertically centered on the left
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.classList.add('carousel-prev', 'carousel-arrow-button');
    prevButton.setAttribute(
      'aria-label',
      placeholders.previous || 'Previous slide',
    );
    prevButton.innerHTML = svgArrowLeft;

    // Next button — lives inside the slides container, vertically centered on the right
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.classList.add('carousel-next', 'carousel-arrow-button');
    nextButton.setAttribute(
      'aria-label',
      placeholders.next || 'Next slide',
    );
    nextButton.innerHTML = svgArrowRight;

    // Indicator pill — lives inside the slides container, bottom-center
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.classList.add('carousel-indicators-nav');
    slideIndicatorsNav.setAttribute(
      'aria-label',
      placeholders.carouselSlideControls || 'Carousel Slide Controls',
    );

    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);

    // Append controls AS SIBLINGS of the slides UL, inside the slides container.
    // This lets them sit on top of the slide image via absolute positioning.
    container.append(prevButton);
    container.append(nextButton);
    container.append(slideIndicatorsNav);
  }

  let slideCount = 0;
  const slides = [];

  rows.forEach((row) => {
    const slide = createSlide(row, slideCount, carouselId);

    if (!slide) {
      row.remove(); // config row
      return;
    }

    slides.push(slide);
    slideCount += 1;
    row.remove();
  });

  slides.forEach((slide, idx) => {
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      if (idx === 0) indicator.setAttribute('data-active', 'true');
      indicator.innerHTML = `<button type="button" aria-label="${
        placeholders.showSlide || 'Show Slide'
      } ${idx + 1} ${placeholders.of || 'of'} ${slides.length}"${idx === 0 ? ' disabled="true"' : ''}></button>`;
      slideIndicators.append(indicator);
    }
  });

  container.prepend(slidesWrapper);
  block.prepend(container);
  if (!isSingleSlide) {
    bindEvents(block);
    startAutoplay(block, duration);
  }
}
