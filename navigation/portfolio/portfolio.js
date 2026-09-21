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

// Lightbox: click the backdrop or the ✕, or press Escape
function closeModal() {
    modal.classList.remove('active');
    navigation.classList.remove('dimmed');
}
modal.addEventListener('click', e => {
    if (e.target === modal || e.target.classList.contains('modal-close')) closeModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});
