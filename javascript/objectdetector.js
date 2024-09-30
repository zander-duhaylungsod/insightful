let detectedObjects = [];
let usingFrontCamera = false;  // Track whether front or back camera is being used
let stream = null;
let lastTapTime = 0;
const doubleTapTimeout = 300;  // Set a window of 300ms for double tap
let mode = "object-detection";  // Default mode (start with object detection)
setTimeout(function() {
    readObjectAloud("Object detection mode. Press anywhere to trigger the function. Swipe left or right to change mode.");
}, 500);
let isActionTriggered = false;  // Ensure action is only triggered on single tap
let isObjectDetectionRunning = false;  // New flag to track object detection

// Function to start the camera
function startCamera(facingMode) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } })
        .then((mediaStream) => {
            stream = mediaStream;
            document.getElementById('camera-stream').srcObject = mediaStream;
        })
        .catch((error) => {
            console.error('Error accessing the camera:', error);
        });
}

// Toggle between front and back cameras
function toggleCamera() {
    usingFrontCamera = !usingFrontCamera;
    const facingMode = usingFrontCamera ? 'user' : 'environment';
    startCamera(facingMode);
}

// Object detection logic
function objectDetection() {
    // Check if the mode is still 'object-detection' and detection is not already running
    if (mode !== "object-detection" || isObjectDetectionRunning) return;

    isObjectDetectionRunning = true;  // Set flag to indicate detection is running

    cocoSsd.load().then(model => {
        model.detect(document.getElementById('camera-stream')).then(predictions => {
            detectedObjects = predictions;
            if (detectedObjects.length > 0) {
                const objectName = detectedObjects[0].class;
                readObjectAloud(objectName);
            } else {
                readObjectAloud("No object detected");
            }

            isObjectDetectionRunning = false;  // Reset flag after detection completes
        }).catch(() => {
            isObjectDetectionRunning = false;  // Reset flag if an error occurs
        });
    });
}


// Text reading logic using OCR
function textReader() {
    // Check if the mode is still 'text-reader' before proceeding
    if (mode !== "text-reader") return;

    const videoElement = document.getElementById('camera-stream');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw the current video frame onto the canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Debug: Create an image from the canvas for manual inspection (optional)
    const imgDataUrl = canvas.toDataURL('image/png');
    console.log("Captured image from canvas:", imgDataUrl);  // You can open this URL in a browser to inspect

    // Perform OCR on the canvas image
    Tesseract.recognize(canvas, 'eng')
        .then(result => {
            console.log("Raw OCR result:", result);  // Log raw OCR result for debugging

            const detectedText = result.data.text.trim();
            
            // Filter and clean up the detected text
            const cleanedText = cleanText(detectedText);

            if (cleanedText) {
                console.log("Cleaned text:", cleanedText);  // Log cleaned text for debugging
                readObjectAloud(`Detected text: ${cleanedText}`);
            } else {
                console.log("No valid text detected");  // Log if no valid text is detected
                readObjectAloud("No valid text detected");
            }
        })
        .catch(err => {
            console.error('Error with OCR:', err);
            readObjectAloud("Error reading text");
        });
}


// Clean and filter the detected text to avoid random characters
function cleanText(text) {
    // Remove any random symbols or unwanted characters
    const cleanedText = text.replace(/[^a-zA-Z0-9\s,.!?]/g, '').trim();
    
    // Check if the cleaned text has a minimum length to be considered valid
    if (cleanedText.length > 2) {
        return cleanedText;
    }
    
    return "";  // Return an empty string if the text is too short
}


// Color detection logic
function colorDetection() {
    // Check if the mode is still 'color-detection' before proceeding
    if (mode !== "color-detection") return;

    const videoElement = document.getElementById('camera-stream');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const colorName = detectDominantColor(imageData.data);
    readObjectAloud(`Dominant color is ${colorName}`);
}


// Detect dominant color and convert RGB to color name
function detectDominantColor(data) {
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }
    r = Math.floor(r / (data.length / 4));
    g = Math.floor(g / (data.length / 4));
    b = Math.floor(b / (data.length / 4));

    return rgbToColorName(r, g, b);
}

function rgbToColorName(r, g, b) {
    if (r > 200 && g < 100 && b < 100) return 'Red';
    if (r < 100 && g > 200 && b < 100) return 'Green';
    if (r < 100 && g < 100 && b > 200) return 'Blue';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r > 200 && g > 200 && b > 200) return 'White';
    if (r < 50 && g < 50 && b < 50) return 'Black';
    return 'Unknown Color';
}

// Function to read out text via speech synthesis
function readObjectAloud(text) {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}

// Stop speech immediately
function stopSpeech() {
    window.speechSynthesis.cancel();
}

// Handle screen taps or clicks to voice out the detected object or switch cameras
document.body.addEventListener('click', () => {
    const currentTime = new Date().getTime();
    const tapDuration = currentTime - lastTapTime;

    if (tapDuration < doubleTapTimeout && tapDuration > 0) {
        toggleCamera();  // Double-tap toggles camera
    } else {
        // Single tap triggers the selected mode action
        if (!isActionTriggered) {
            isActionTriggered = true;

            stopSpeech();  // Stop any ongoing speech when action is triggered

            // Trigger the appropriate action based on the mode
            if (mode === "object-detection") {
                objectDetection();
            } else if (mode === "text-reader") {
                textReader();
            } else if (mode === "color-detection") {
                colorDetection();
            }

            setTimeout(() => { isActionTriggered = false; }, 1000);  // Add delay between taps
        }
    }

    lastTapTime = currentTime;
});


// Get all choices and set the current index
let choices = document.querySelectorAll('.choice');
let currentIndex = 0;  // Start with the first choice

// Update the appearance and positioning of the choices
function updateSelection(index) {
    choices.forEach((choice, i) => {
        choice.classList.remove('left', 'right', 'selected');  // Remove previous classes

        if (i === index) {
            choice.classList.add('selected');  // Center the selected choice
        } else if (i < index) {
            choice.classList.add('left');  // Slightly move left of the current
        } else if (i > index) {
            choice.classList.add('right');  // Slightly move right of the current
        }
    });
}

//default fade out
fadeOutChoice(2);  // Fade out the color detection box (index 2)

// Handle choice selection by click
choices.forEach((choice, index) => {
    choice.addEventListener('click', function() {
        stopSpeech();  // Stop ongoing speech

        // Update the mode based on the clicked choice
        if (index === 0) {
            mode = "object-detection";
            fadeOutChoice(2);  // Fade out the color detection box (index 2)
        } else if (index === 1) {
            mode = "text-reader";
            fadeOutOtherChoices(1);
        } else if (index === 2) {
            mode = "color-detection";
            fadeOutChoice(0);  // Fade out the color detection box (index 2)
        }

        currentIndex = index;  // Update the current index
        updateSelection(currentIndex);  // Re-center the selection
    });
});

// Swipe detection for cycling through choices
let touchstartX = 0;
let touchendX = 0;

document.addEventListener('touchstart', function(event) {
    touchstartX = event.changedTouches[0].screenX;  // Start of swipe
});

document.addEventListener('touchend', function(event) {
    touchendX = event.changedTouches[0].screenX;  // End of swipe
    handleGesture();  // Handle the gesture
});

// Handle swipe gestures
function handleGesture() {
    if (touchendX < touchstartX) {
        // Swipe left to move to the next choice
        currentIndex = (currentIndex + 1) % choices.length;
    }
    if (touchendX > touchstartX) {
        // Swipe right to move to the previous choice
        currentIndex = (currentIndex - 1 + choices.length) % choices.length;
    }

    updateSelection(currentIndex);  // Re-center the selection

    // Update the mode based on the new index
    if (currentIndex === 0) {
        mode = "object-detection";
        fadeOutChoice(2);  // Fade out the color detection box (index 2)
    } else if (currentIndex === 1) {
        mode = "text-reader";
        fadeOutOtherChoices(1);
    } else if (currentIndex === 2) {
        mode = "color-detection";
        fadeOutChoice(0);  // Fade out the color detection box (index 2)
    }

    stopSpeech();  // Stop any ongoing speech when switching modes

    if (currentIndex === 0) {
        readObjectAloud("Object detection mode");
    } else if (currentIndex === 1) {
        readObjectAloud("Text reader mode");
    } else if (currentIndex === 2) {
        readObjectAloud("Color detection mode");
    }
}

// Fade out a specific choice by setting its opacity to 0
function fadeOutChoice(choiceIndex) {
    choices.forEach((choice, index) => {
        if (index === choiceIndex) {
            choice.style.opacity = 0;  // Fade out the choice
            choice.style.pointerEvents = 'none';  // Disable interaction with the faded choice
        } else {
            if(index===2) {
                choice.style.opacity = 1; 
            } else if (index==0) {
                choice.style.opacity = 1; 
            } else {
                choice.style.opacity = 0.3; 
            }
            choice.style.pointerEvents = 'auto';  // Enable interaction
        }
    });
}

// Fade out all choices except the currently selected one
function fadeOutOtherChoices(selectedIndex) {
    choices.forEach((choice, index) => {
        if (index === selectedIndex) {
            choice.style.opacity = 1;  // Keep the selected choice fully visible
            choice.style.pointerEvents = 'auto';  // Allow interaction with the selected choice
        } else {
            choice.style.opacity = 0.3;  // Fade out the non-selected choices
            choice.style.pointerEvents = 'none';  // Disable interaction with non-selected choices
        }
    });
}

// Reset the visibility of all choices
function resetChoiceVisibility() {
    choices.forEach(choice => {
        choice.style.opacity = 1;  // Reset opacity for all choices
        choice.style.pointerEvents = 'auto';  // Enable interaction
    });
}

// Start the camera with the default back camera (environment mode)
startCamera('environment');

// Initial setup to center the first choice
updateSelection(currentIndex);
