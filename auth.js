const API_USERS = "http://localhost:3000/users";

// --- USER LOGIN LOGIC ---
const userForm = document.getElementById('userLoginForm');
if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userVal = document.getElementById('username').value;
        const passVal = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_USERS}?username=${userVal}&password=${passVal}`);
            const users = await res.json();

            if (users.length > 0) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', users[0].username);
                sessionStorage.setItem('role', users[0].role || 'user'); // Default to 'user'
                window.location.href = "index.html"; 
            } else {
                document.getElementById('loginError').classList.remove('d-none');
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Connection error. Please try again later.");
        }
    });
}

// --- ADMIN LOGIN LOGIC ---
const adminForm = document.getElementById('adminLoginForm');
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userVal = document.getElementById('adminUsername').value;
        const passVal = document.getElementById('adminPassword').value;
        const errorMsg = document.getElementById('adminError');

        try {
            // 1. Fetch users by username
            const res = await fetch(`${API_USERS}?username=${userVal}`);
            const users = await res.json();

            // 2. Find specifically an ADMIN with that password
            const adminUser = users.find(u => u.password === passVal && u.role === 'admin');

            if (adminUser) {
                // Success - Save role as admin
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', adminUser.username);
                sessionStorage.setItem('role', 'admin');
                
                alert("Welcome Admin! Loading Dashboard...");
                window.location.href = "admin.html";
            } else {
                // Failure
                if (errorMsg) {
                    errorMsg.classList.remove('d-none');
                } else {
                    alert("Access Denied: You are not authorized as an Admin.");
                }
            }
        } catch (error) {
            console.error("Admin Login Error:", error);
            alert("Database connection failed. Please start your json-server.");
        }
    });
}