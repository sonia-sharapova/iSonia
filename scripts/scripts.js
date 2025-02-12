function cycleImages() {
    const images = document.querySelectorAll('.profile-img, .gallery-item');
    images.forEach((img, index) => {
        setInterval(() => {
            img.style.opacity = 0;
            setTimeout(() => {
                img.style.opacity = 1;
            }, 500);
        }, 3000 + (index * 1000));
    });
}


// Image click handler function
function attachImageClickHandlers() {
    document.querySelectorAll('.img_col img, .section-content img, .im img, .gallery-item img').forEach(img => {
        img.addEventListener('click', () => {
            modalImg.src = img.src;
            modal.classList.add('active');
            navigation.classList.add('dimmed');
        });
    });
}