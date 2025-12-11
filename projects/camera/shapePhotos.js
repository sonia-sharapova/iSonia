document.addEventListener('DOMContentLoaded', () => {
    console.log('Shape Photo Maker loaded, initializing...');

    // DOM elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const videoElement = document.getElementById('videoElement');
    const shapePreview = document.getElementById('shapePreview');
    const startButton = document.getElementById('startCamera');
    const stopButton = document.getElementById('stopCamera');
    const cameraSelect = document.getElementById('cameraSelect');
    const uploadPhotoInput = document.getElementById('uploadPhoto');
    const clearPhotosButton = document.getElementById('clearPhotosButton');
    const downloadButton = document.getElementById('downloadButton');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    const gridContainer = document.getElementById('gridContainer');
    const shapeOptions = document.querySelectorAll('.shape-option');
    const gridOptions = document.querySelectorAll('.grid-option');
    const flipButton = document.getElementById('flipButton');
    const cameraModeSpan = document.getElementById('cameraMode');

    // Debug: Check if critical elements exist
    console.log('DOM Elements Check:', {
        canvas: !!canvas,
        gridContainer: !!gridContainer,
        shapePreview: !!shapePreview,
        videoElement: !!videoElement,
        shapeOptions: shapeOptions.length,
        gridOptions: gridOptions.length
    });

    if (!gridContainer) {
        console.error('CRITICAL: gridContainer not found!');
        return;
    }

    console.log('Grid container dimensions:', {
        width: gridContainer.offsetWidth,
        height: gridContainer.offsetHeight,
        display: window.getComputedStyle(gridContainer).display
    });

    // Configuration
    let currentShape = 'heart'; // Default shape
    let currentGrid = 3; // Default grid size (3x3)
    let currentCellIndex = 0; // Current cell to fill
    let stream = null;
    let isRunning = false;
    let photoGrid = [];
    let isFrontCamera = true; // Start with front camera (mirrored)
    let shapePaths = {
        heart: "M50 30 L20 10 Q0 10 0 30 Q0 60 50 90 Q100 60 100 30 Q100 10 80 10 Z",
        star: "M50 10 L61 39 L93 39 L67 59 L78 90 L50 70 L22 90 L33 59 L7 39 L39 39 Z",
        spiral: "M50 50 C50 10, 90 10, 90 50 C90 80, 20 80, 20 50 C20 30, 70 30, 70 50 C70 70, 30 70, 30 50 C30 40, 60 40, 60 50 C60 60, 40 60, 40 50 C40 45, 55 45, 50 50"
    };

    // Shape colors
    let shapeColors = {
        heart: "#ffc9c9",
        star: "#ffd166",
        spiral: "#06d6a0"
    };

    // Initialize canvas and grid
    function initCanvas() {
        const containerWidth = canvas.parentElement.clientWidth;
        const size = Math.min(containerWidth, window.innerHeight * 0.7);

        canvas.width = size;
        canvas.height = size;

        clearCanvas();
        drawShapePreview();
        setupGrid();
    }

    // Clear canvas
    function clearCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw shape preview on SVG element
    function drawShapePreview() {
        // Set the path for the current shape
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", shapePaths[currentShape]);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", shapeColors[currentShape]);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-dasharray", "5,5");

        // Clear previous shape
        while (shapePreview.firstChild) {
            shapePreview.removeChild(shapePreview.firstChild);
        }

        // Add new shape path
        shapePreview.appendChild(path);

        // Update opacity from slider
        shapePreview.style.opacity = opacitySlider.value / 100;
    }

    // Setup grid based on currentGrid value (3x3 or 4x4)
    function setupGrid() {
        console.log('=== SETUP GRID START ===');
        console.log('Setting up grid with size:', currentGrid);
        console.log('Grid container element:', gridContainer);
        console.log('Grid container parent:', gridContainer.parentElement);

        // Clear previous grid
        while (gridContainer.firstChild) {
            gridContainer.removeChild(gridContainer.firstChild);
        }

        // Reset photo grid array
        photoGrid = new Array(currentGrid * currentGrid).fill(null);
        currentCellIndex = 0;

        // Set grid template
        gridContainer.style.gridTemplateColumns = `repeat(${currentGrid}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${currentGrid}, 1fr)`;
        gridContainer.style.display = 'grid';
        gridContainer.style.gap = '0px';

        console.log('Grid container styles set:', {
            gridTemplateColumns: gridContainer.style.gridTemplateColumns,
            gridTemplateRows: gridContainer.style.gridTemplateRows,
            display: gridContainer.style.display,
            width: gridContainer.style.width,
            height: gridContainer.style.height
        });

        // Create grid cells
        const cellsToCreate = currentGrid * currentGrid;
        console.log('Creating', cellsToCreate, 'grid cells');

        for (let i = 0; i < cellsToCreate; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            cell.dataset.index = i;
            cell.style.border = '3px solid red'; // Temporary high-visibility border for testing
            cell.style.minHeight = '50px';
            cell.style.minWidth = '50px';
            cell.style.background = 'rgba(255, 0, 0, 0.1)'; // Temporary red tint for testing

            const overlay = document.createElement('div');
            overlay.className = 'grid-item-overlay';
            overlay.innerHTML = `+${i}`; // Show cell number for debugging
            overlay.dataset.index = i;
            overlay.style.fontSize = '20px';
            overlay.style.fontWeight = 'bold';
            overlay.addEventListener('click', (e) => {
                console.log('Grid cell clicked:', i);
                e.stopPropagation();
                currentCellIndex = i;
                if (isRunning) {
                    takePhoto();
                } else {
                    alert('Please start the camera first to take photos');
                }
            });

            cell.appendChild(overlay);
            gridContainer.appendChild(cell);

            if (i === 0) {
                console.log('First cell created:', {
                    element: cell,
                    classList: cell.classList,
                    styles: cell.style.cssText
                });
            }
        }

        console.log('Grid cells created. Grid container children count:', gridContainer.children.length);
        console.log('Grid container computed style:', window.getComputedStyle(gridContainer).display);
        console.log('=== SETUP GRID END ===');

    }

    // Start camera with selected device
    async function startCamera() {
        try {
            if (stream) {
                stopCamera(false);
            }

            const constraints = {
                video: {
                    deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
                    facingMode: isFrontCamera ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = stream;
            videoElement.style.display = 'block';

            // Apply mirroring for front camera
            videoElement.style.transform = isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)';
            cameraModeSpan.textContent = isFrontCamera ? 'front' : 'back';

            videoElement.onloadedmetadata = () => {
                videoElement.play().then(() => {
                    console.log('Camera started');
                    isRunning = true;

                    // Update UI
                    startButton.disabled = true;
                    stopButton.disabled = false;
                    takePhotoButton.disabled = false;
                    flipButton.disabled = false;
                }).catch(err => {
                    console.error('Error playing video:', err);
                    alert('Could not play video: ' + err.message);
                });
            };

            // If we haven't already enumerated cameras, do it now
            if (cameraSelect.options.length <= 1) {
                getCameras();
            }
        } catch (error) {
            console.error('Error starting camera:', error);
            alert('Could not access camera: ' + error.message + '. Make sure camera permissions are granted.');
        }
    }

    // Stop camera
    function stopCamera(updateUI = true) {
        isRunning = false;

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            videoElement.srcObject = null;
            videoElement.style.display = 'none';
        }

        if (updateUI) {
            startButton.disabled = false;
            stopButton.disabled = true;
            flipButton.disabled = true;
        }
    }

    // Take photo from camera
    function takePhoto() {
        if (!isRunning) {
            alert('Please start the camera first');
            return;
        }

        console.log('Taking photo for cell:', currentCellIndex);

        // Get the grid cell element
        const gridCell = gridContainer.querySelector(`.grid-item[data-index="${currentCellIndex}"]`);
        if (!gridCell) {
            console.error('Grid cell not found');
            return;
        }

        // Get the position and size of the grid cell relative to the video element
        const gridRect = gridCell.getBoundingClientRect();
        const videoRect = videoElement.getBoundingClientRect();

        console.log('Grid rect:', gridRect);
        console.log('Video rect:', videoRect);

        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Set canvas size to match the grid cell size exactly
        tempCanvas.width = gridRect.width;
        tempCanvas.height = gridRect.height;

        // Calculate what portion of the video is visible in this grid cell
        // This accounts for the video's object-fit: cover behavior
        const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        const displayAspectRatio = videoRect.width / videoRect.height;

        let renderWidth, renderHeight, offsetX, offsetY;

        if (videoAspectRatio > displayAspectRatio) {
            // Video is wider than display - it's cropped on left/right
            renderHeight = videoRect.height;
            renderWidth = videoElement.videoWidth * (videoRect.height / videoElement.videoHeight);
            offsetX = (videoRect.width - renderWidth) / 2;
            offsetY = 0;
        } else {
            // Video is taller than display - it's cropped on top/bottom
            renderWidth = videoRect.width;
            renderHeight = videoElement.videoHeight * (videoRect.width / videoElement.videoWidth);
            offsetX = 0;
            offsetY = (videoRect.height - renderHeight) / 2;
        }

        // Calculate the position within the rendered video
        const cellLeftInVideo = (gridRect.left - videoRect.left - offsetX) / renderWidth;
        const cellTopInVideo = (gridRect.top - videoRect.top - offsetY) / renderHeight;
        const cellWidthInVideo = gridRect.width / renderWidth;
        const cellHeightInVideo = gridRect.height / renderHeight;

        // Convert to source video coordinates
        const sourceX = cellLeftInVideo * videoElement.videoWidth;
        const sourceY = cellTopInVideo * videoElement.videoHeight;
        const sourceWidth = cellWidthInVideo * videoElement.videoWidth;
        const sourceHeight = cellHeightInVideo * videoElement.videoHeight;

        console.log('Source crop:', { sourceX, sourceY, sourceWidth, sourceHeight });

        // If front camera, account for mirroring
        if (isFrontCamera) {
            tempCtx.translate(tempCanvas.width, 0);
            tempCtx.scale(-1, 1);

            // Flip x coordinate for mirrored video
            const mirroredSourceX = videoElement.videoWidth - sourceX - sourceWidth;
            tempCtx.drawImage(
                videoElement,
                mirroredSourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, tempCanvas.width, tempCanvas.height
            );
        } else {
            tempCtx.drawImage(
                videoElement,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, tempCanvas.width, tempCanvas.height
            );
        }

        // Get the image data as a data URL
        const imageDataURL = tempCanvas.toDataURL('image/png');

        // Add the photo to the specific grid cell
        addPhotoToGrid(imageDataURL);

        // Flash effect
        createFlashEffect();

        // Play camera shutter sound
        const shutterSound = new Audio('https://freesound.org/data/previews/244/244982_4484600-lq.mp3');
        shutterSound.play().catch(error => {
            console.log('Could not play shutter sound:', error);
        });

        console.log('Photo captured and added to cell:', currentCellIndex);
    }

    // Create flash effect
    function createFlashEffect() {
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.pointerEvents = 'none';
        flashOverlay.className = 'flash';

        canvas.parentElement.appendChild(flashOverlay);

        // Remove the flash overlay after animation completes
        setTimeout(() => {
            flashOverlay.remove();
        }, 500);
    }

    // Add photo to the grid
    function addPhotoToGrid(imageDataURL) {
        console.log('Adding photo to grid cell:', currentCellIndex);

        // Store the image data URL in the photoGrid array
        photoGrid[currentCellIndex] = imageDataURL;

        // Get the corresponding grid cell
        const gridCell = gridContainer.querySelector(`.grid-item[data-index="${currentCellIndex}"]`);

        if (!gridCell) {
            console.error('Grid cell not found for index:', currentCellIndex);
            return;
        }

        // Check if there's already an image in this cell
        let img = gridCell.querySelector('img');

        if (!img) {
            // Create a new image element if one doesn't exist
            img = document.createElement('img');
            gridCell.appendChild(img);
        }

        // Set the image source and styling to fill the cell
        img.src = imageDataURL;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'center';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.transform = 'none'; // Remove scale transform

        // Mark cell as filled and hide the overlay
        gridCell.classList.add('filled');
        const overlay = gridCell.querySelector('.grid-item-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        console.log('Photo added to cell:', currentCellIndex, 'Grid cell now has', gridCell.children.length, 'children');

        // Don't auto-advance - let user click the cell they want to fill next
    }

    // Clear all photos
    function clearPhotos() {
        // Reset photo grid array
        photoGrid = new Array(currentGrid * currentGrid).fill(null);
        currentCellIndex = 0;

        // Clear all grid cells
        document.querySelectorAll('.grid-item').forEach(cell => {
            const img = cell.querySelector('img');
            if (img) {
                cell.removeChild(img);
            }

            // Show the overlay
            const overlay = cell.querySelector('.grid-item-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
        });

    }

    // Generate final image with shape mask
    function generateFinalImage() {
        // Create a temporary canvas for the final image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Set the size to match the main canvas
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // Draw a white background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Create a path for the shape
        tempCtx.beginPath();
        const path = new Path2D(shapePaths[currentShape]);

        // Scale the path to fit the canvas
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.scale(tempCanvas.width / 100, tempCanvas.height / 100);
        tempCtx.translate(-50, -50);

        // Draw the grid cells within the shape
        tempCtx.save();
        tempCtx.clip(path);

        // Reset the transform for drawing the grid
        tempCtx.resetTransform();

        // Calculate cell size
        const cellSize = tempCanvas.width / currentGrid;

        // Draw each photo in the grid
        photoGrid.forEach((imageDataURL, index) => {
            if (imageDataURL) {
                const row = Math.floor(index / currentGrid);
                const col = index % currentGrid;

                const x = col * cellSize;
                const y = row * cellSize;

                // Create an image element
                const img = new Image();
                img.src = imageDataURL;

                // Draw the image when it's loaded
                img.onload = function() {
                    // Calculate scaling to maintain aspect ratio
                    const scale = imageScale / 100;
                    const imgWidth = cellSize * scale;
                    const imgHeight = (img.height / img.width) * imgWidth;

                    // Center the image in the cell
                    const imgX = x + (cellSize - imgWidth) / 2;
                    const imgY = y + (cellSize - imgHeight) / 2;

                    tempCtx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

                    // Check if this is the last image
                    if (index === photoGrid.length - 1 || index === photoGrid.filter(Boolean).length - 1) {
                        // Draw the shape outline
                        tempCtx.restore();
                        tempCtx.resetTransform();
                        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                        tempCtx.scale(tempCanvas.width / 100, tempCanvas.height / 100);
                        tempCtx.translate(-50, -50);

                        // Draw the shape outline
                        tempCtx.strokeStyle = shapeColors[currentShape];
                        tempCtx.lineWidth = 2;
                        tempCtx.stroke(path);

                        // Convert the canvas to a data URL and download it
                        const dataURL = tempCanvas.toDataURL('image/png');
                        downloadImage(dataURL);
                    }
                };
            }
        });

        // If no photos, just show an outline
        if (photoGrid.filter(Boolean).length === 0) {
            tempCtx.restore();
            tempCtx.strokeStyle = shapeColors[currentShape];
            tempCtx.lineWidth = 2;
            tempCtx.stroke(path);

            // Convert the canvas to a data URL and download it
            const dataURL = tempCanvas.toDataURL('image/png');
            downloadImage(dataURL);
        }
    }

    // Download the generated image
    function downloadImage(dataURL) {
        const link = document.createElement('a');
        link.download = `shape-collage-${currentShape}.png`;
        link.href = dataURL;
        link.click();
    }

    // Get available cameras
    async function getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            // Clear the select options
            cameraSelect.innerHTML = '';

            // Add options for each camera
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Enable the select if multiple cameras are available
            cameraSelect.disabled = videoDevices.length <= 1;

            return videoDevices.length > 0;
        } catch (error) {
            console.error('Error enumerating devices:', error);
            cameraSelect.innerHTML = '<option value="">No cameras found</option>';
            return false;
        }
    }

    // Update shape outline opacity
    function updateOpacity() {
        const opacity = opacitySlider.value;
        opacityValue.textContent = opacity;
        shapePreview.style.opacity = opacity / 100;
    }

    // Flip camera between front and back
    function flipCamera() {
        isFrontCamera = !isFrontCamera;
        if (isRunning) {
            startCamera();
        }
    }

    // Event listeners
    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', () => stopCamera(true));
    flipButton.addEventListener('click', flipCamera);
    // Removed upload functionality
    clearPhotosButton.addEventListener('click', clearPhotos);
    downloadButton.addEventListener('click', generateFinalImage);
    opacitySlider.addEventListener('input', updateOpacity);

    // Shape option event listeners
    shapeOptions.forEach(option => {
        option.addEventListener('click', function() {
            console.log('Shape clicked:', this.dataset.shape);

            // Update selected shape
            shapeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            // Update current shape
            currentShape = this.dataset.shape;

            // Update shape preview
            drawShapePreview();
        });
    });

    // Grid option event listeners
    gridOptions.forEach(option => {
        option.addEventListener('click', function() {
            console.log('Grid clicked:', this.dataset.grid);

            // Update selected grid
            gridOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            // Update current grid
            currentGrid = parseInt(this.dataset.grid);

            // Setup new grid
            setupGrid();
        });
    });

    // Camera select event listener
    cameraSelect.addEventListener('change', () => {
        if (stream) {
            startCamera();
        }
    });

    // Initial setup
    stopButton.disabled = true;
    flipButton.disabled = true;

    // Function to initialize everything
    function init() {
        console.log('Initializing ShapePhotoMaker...');

        // Select default shape and grid
        const defaultShapeOption = document.querySelector(`.shape-option[data-shape="${currentShape}"]`);
        if (defaultShapeOption) {
            defaultShapeOption.classList.add('selected');
            console.log('Selected default shape:', currentShape);
        } else {
            console.error('Default shape option not found');
        }

        const defaultGridOption = document.querySelector(`.grid-option[data-grid="${currentGrid}"]`);
        if (defaultGridOption) {
            defaultGridOption.classList.add('selected');
            console.log('Selected default grid:', currentGrid);
        } else {
            console.error('Default grid option not found');
        }

        // Initialize canvas and get cameras
        initCanvas();
        getCameras();

        console.log('Initialization complete');
    }

    // Call init immediately since we're already in DOMContentLoaded
    init();

    // Handle window resize
    window.addEventListener('resize', initCanvas);
});