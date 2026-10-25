// Portfolio pages — each project is its own page (imaging.html, tracing.html, ...), so this only
// handles the shared bits: the topic list, the phone accordion layout and the image lightbox.

const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');     // modal, modalImg and navigation are
const navigation = document.querySelector('.navigation');   // also used by attachImageClickHandlers() (images.js)
const topicsList = document.getElementById('topicsList');

// A whole row is a target, not just the link text (the row is padded, and a big tap area on phones)
topicsList.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', e => {
        const a = li.querySelector('a');
        if (a && !e.target.closest('a') && !li.classList.contains('active')) window.location.href = a.href;
    });
});

// On mobile the open topic's details sit inline under its heading (accordion);
// on desktop they stay in the side panel where they started.
const sectionEl = document.querySelector('.container_inner .section');
const sectionHome = sectionEl.parentElement;
const mobileQuery = window.matchMedia('(max-width: 768px)');

function placeSection() {
    const active = topicsList.querySelector('li.active');
    if (mobileQuery.matches && active) {
        active.after(sectionEl);
    } else {
        sectionHome.appendChild(sectionEl);
    }
}
mobileQuery.addEventListener('change', placeSection);
placeSection();

attachImageClickHandlers();

// Lightbox carousel: the ‹ › arrows (or ← →) step through every image in the project's
// content, wrapping round at the ends. attachImageClickHandlers() opens the clicked one;
// this just remembers where it is in the list.
const carouselImgs = Array.from(document.querySelectorAll('.section-content img'));
let carouselIndex = 0;
const modalContent = modal.querySelector('.modal-content');
['prev', 'next'].forEach(dir => {
    const btn = document.createElement('button');
    btn.className = 'modal-arrow modal-' + dir;
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous image' : 'Next image');
    btn.textContent = dir === 'prev' ? '‹' : '›';
    btn.addEventListener('click', e => { e.stopPropagation(); stepCarousel(dir === 'prev' ? -1 : 1); });
    modalContent.appendChild(btn);
});
modal.classList.toggle('single', carouselImgs.length < 2);
carouselImgs.forEach((img, i) => img.addEventListener('click', () => { carouselIndex = i; }));
function stepCarousel(by) {
    if (carouselImgs.length < 2) return;
    carouselIndex = (carouselIndex + by + carouselImgs.length) % carouselImgs.length;
    modalImg.src = carouselImgs[carouselIndex].src;
}

// Lightbox: click the backdrop or the ✕, or press Escape
function closeModal() {
    modal.classList.remove('active');
    navigation.classList.remove('dimmed');
}
modal.addEventListener('click', e => {
    if (e.target === modal || e.target.classList.contains('modal-close')) closeModal();
});
document.addEventListener('keydown', e => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowLeft') stepCarousel(-1);
    else if (e.key === 'ArrowRight') stepCarousel(1);
});
