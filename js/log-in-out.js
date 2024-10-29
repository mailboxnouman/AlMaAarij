document.querySelectorAll('.authButton').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        checkAuthStatus(); // Call checkAuthStatus on button click
    });
});

// Check auth status on page load
window.onload = checkAuthStatus;

async function checkAuthStatus() {
    try {
        const response = await fetch('/isAuthenticated');
        const data = await response.json();

        // Update all buttons with the class 'authButton'
        document.querySelectorAll('.authButton').forEach(button => {
            if (data.isAuthenticated) {
                button.innerHTML = `<i class="fa fa-user"></i> لاگ آوٹ - ${data.displayName}`;
                button.onclick = async () => {
                    await fetch('/logout', { method: 'GET' });
                    window.location.reload(); // Refresh page to update button state
                };
            } else {
                button.innerHTML = '<i class="fa fa-user"></i> لاگ ان';
                button.onclick = () => {
                    window.location.href = '/auth/google';
                };
            }
        });
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}
