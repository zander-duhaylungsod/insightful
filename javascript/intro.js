document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        readObjectAloud("Welcome to INSIGHTFUL! Press anywhere to start the app.");
        // Moved inside a touch event to ensure it works on mobile
        document.addEventListener('click', function() {            
            var overlay = document.getElementById('overlay');
            overlay.classList.add('expand');
            setTimeout(function() {
                window.location.href = 'objectdetector.html';
            }, 500);  // Match this duration with the CSS transition duration
        }, { once: true });  // Ensure this only runs once
    }, 500);
});

// Function to read out text via speech synthesis
function readObjectAloud(text) {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}

