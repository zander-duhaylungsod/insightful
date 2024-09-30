// document.addEventListener('DOMContentLoaded', function() {
    // var msg = new SpeechSynthesisUtterance();
    // msg.text = "Welcome to INSIGHTFUL! Press anywhere to start the app.";
    // // Add a delay of 2 seconds (2000 milliseconds)
    setTimeout(function() {
        readObjectAloud("Welcome to INSIGHTFUL! Press anywhere to start the app.");
    }, 2000);
// });

document.addEventListener('click', function() {
    var overlay = document.getElementById('overlay');
    overlay.classList.add('expand');
    setTimeout(function() {
        window.location.href = 'objectdetector.html';
    }, 500); // Match this duration with the CSS transition duration
});

// Function to read out text via speech synthesis
function readObjectAloud(text) {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}
