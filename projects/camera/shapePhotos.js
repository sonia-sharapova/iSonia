document.addEventListener('DOMContentLoaded', () => {
    console.log('Shape Photo Maker loaded, initializing...');

    // DOM elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const videoElement = document.getElementById('videoElement');
    const shapePreview = document.getElementById('shapePreview');
    const startButton = document.getElementById('startCamera');
    const stopButton = document.getElementById('stopCamera');
    const takePhotoButton = document.getElementById('takePhotoButton');
    const cameraSelect = document.getElementById('cameraSelect');
    const uploadPhotoInput = document.getElementById('uploadPhoto');
    const clearPhotosButton = document.getElementById('clearPhotosButton');
    const downloadButton = document.getElementById('downloadButton');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');
    const gridContainer = document.getElementById('gridContainer');
    const shapeOptions = document.querySelectorAll('.shape-option');
    const gridOptions = document.querySelectorAll('.grid-option');

    // Configuration
    let currentShape = 'heart'; // Default shape
    let currentGrid = 3; // Default grid size (3x3)
    let currentCellIndex = 0; // Current cell to fill
    let stream = null;
    let imageScale = 100; // Default scale percentage
    let isRunning = false;
    let photoGrid = [];
    let shapePaths = {
        heart: "M50 30 L20 10 Q0 10 0 30 Q0 60 50 90 Q100 60 100 30 Q100 10 80 10 Z",
        star: "M50 10 L61 39 L93 39 L67 59 L78 90 L50 70 L22 90 L33 59 L7 39 L39 39 Z",
        spiral: "M50 50 C50 10, 90 10, 90 50 C90 80, 20 80, 20 50 C20 30, 70 30, 70 50 C70 70, 30 70, 30 50 C30 40, 60 40, 60 50 C60 60, 40 60, 40 50 C40 45, 55 45, 50 50"
    };

    // Shape colors
    let shapeColors = {
        heart: "#ff6b6b",
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

        // Create grid cells
        for (let i = 0; i < currentGrid * currentGrid; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            cell.dataset.index = i;

            const overlay = document.createElement('div');
            overlay.className = 'grid-item-overlay';
            overlay.innerHTML = '+';
            overlay.dataset.index = i;
            overlay.addEventListener('click', () => {
                currentCellIndex = i;
                if (isRunning) {
                    takePhoto();
                } else {
                    uploadPhotoInput.click();
                }
            });

            cell.appendChild(overlay);
            gridContainer.appendChild(cell);
        }

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
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = stream;
            videoElement.style.display = 'block';

            videoElement.onloadedmetadata = () => {
                videoElement.play().then(() => {
                    console.log('Camera started');
                    isRunning = true;

                    // Update UI
                    startButton.disabled = true;
                    stopButton.disabled = false;
                    takePhotoButton.disabled = false;
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
            takePhotoButton.disabled = true;
        }
    }

    // Take photo from camera
    function takePhoto() {
        if (!isRunning) {
            alert('Please start the camera first');
            return;
        }

        // Create a temporary canvas to capture the video frame
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Set the size to match the video dimensions
        tempCanvas.width = videoElement.videoWidth;
        tempCanvas.height = videoElement.videoHeight;

        // Draw the current video frame to the temporary canvas
        tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

        // Get the image data as a data URL
        const imageDataURL = tempCanvas.toDataURL('image/png');

        // Add the photo to the grid
        addPhotoToGrid(imageDataURL);

        // Flash effect
        createFlashEffect();

        // Play camera shutter sound
        const shutterSound = new Audio('https://freesound.org/data/previews/244/244982_4484600-lq.mp3');
        shutterSound.play().catch(error => {
            console.log('Could not play shutter sound:', error);
        });
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
        // Store the image data URL in the photoGrid array
        photoGrid[currentCellIndex] = imageDataURL;

        // Get the corresponding grid cell
        const gridCell = gridContainer.querySelector(`.grid-item[data-index="${currentCellIndex}"]`);

        // Check if there's already an image in this cell
        let img = gridCell.querySelector('img');

        if (!img) {
            // Create a new image element if one doesn't exist
            img = document.createElement('img');
            gridCell.appendChild(img);
        }

        // Set the image source and scale
        img.src = imageDataURL;
        img.style.transform = `scale(${imageScale / 100})`;

        // Hide the overlay
        const overlay = gridCell.querySelector('.grid-item-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        // Move to next cell if available
        if (currentCellIndex < photoGrid.length - 1) {
            currentCellIndex++;
        }

    }

    // Handle file upload
    function handleFileUpload(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];

            // Check if it's an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const imageDataURL = e.target.result;
                addPhotoToGrid(imageDataURL);
            };
            reader.readAsDataURL(file);
        }

        // Reset the input so the same file can be selected again
        event.target.value = '';
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

    // Update image scale
    function updateScale() {
        imageScale = scaleSlider.value;
        scaleValue.textContent = imageScale;

        // Update all displayed images with new scale
        document.querySelectorAll('.grid-item img').forEach(img => {
            img.style.transform = `scale(${imageScale / 100})`;
        });
    }

    // Event listeners
    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', () => stopCamera(true));
    takePhotoButton.addEventListener('click', takePhoto);
    uploadPhotoInput.addEventListener('change', handleFileUpload);
    clearPhotosButton.addEventListener('click', clearPhotos);
    downloadButton.addEventListener('click', generateFinalImage);
    opacitySlider.addEventListener('input', updateOpacity);
    scaleSlider.addEventListener('input', updateScale);

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
    takePhotoButton.disabled = true;

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

    // Call init when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle window resize
    window.addEventListener('resize', initCanvas);
});