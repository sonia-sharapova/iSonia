document.addEventListener('DOMContentLoaded', () => {
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach((item, idx) => {
        const images = item.querySelectorAll('.project-images img');

        if (images.length > 1) {
            let currentIndex = 0;
            let cycleInterval = null;

            // Start cycling images on hover
            item.addEventListener('mouseenter', () => {
                console.log(`Mouse entered project ${idx + 1}`);

                // Clear any existing interval first
                if (cycleInterval) clearInterval(cycleInterval);

                // Create new cycling interval with horizontal sliding
                cycleInterval = setInterval(() => {
                    // Hide current image by sliding it left
                    images[currentIndex].style.transform = 'translateX(-100%)';

                    // Move to next image
                    currentIndex = (currentIndex + 1) % images.length;

                    // Show next image by sliding it in from right
                    images[currentIndex].style.transform = 'translateX(0)';

                    // Reset positions of other images
                    for (let i = 0; i < images.length; i++) {
                        if (i !== currentIndex && i !== (currentIndex - 1 + images.length) % images.length) {
                            images[i].style.transform = 'translateX(100%)';
                        }
                    }

                    console.log(`Project ${idx + 1}: showing image ${currentIndex + 1} of ${images.length}`);
                }, 900); // 0.9 seconds per image (900ms)
            });

            // Stop cycling images when mouse leaves
            item.addEventListener('mouseleave', () => {
                console.log(`Mouse left project ${idx + 1}`);

                // Clear the interval
                if (cycleInterval) {
                    clearInterval(cycleInterval);
                    cycleInterval = null;
                }

                // Reset all images to their default positions
                images.forEach((img, i) => {
                    img.style.transform = i === 0 ? 'translateX(0)' : 'translateX(100%)';
                });

                // Reset index
                currentIndex = 0;
            });
        }
    });
});