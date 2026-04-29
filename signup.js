const USERS_URL = "http://localhost:3000/users";

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 1. Basic validation
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        // 2. Check if username already exists
        const checkRes = await fetch(`${USERS_URL}?username=${username}`);
        const existingUsers = await checkRes.json();

        if (existingUsers.length > 0) {
            alert("Username already taken. Please choose another.");
            return;
        }

        // 3. Create the new user object
        const newUser = {
            username: username,
            password: password,
            role: "user" // Default role is always 'user'
        };

        // 4. POST to json-server
        const saveRes = await fetch(USERS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (saveRes.ok) {
            alert("Registration successful! Please login.");
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error("Signup error:", error);
        alert("Server error. Make sure json-server is running.");
    }
});