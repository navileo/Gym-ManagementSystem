// Auth Logic using Firebase
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authLink = document.getElementById('auth-link');

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm['email'].value;
            const password = loginForm['password'].value;

            // Check for default admin login
            if (email === 'admin@gmail.com' && password === 'admin@gmail.com') {
                auth.signInWithEmailAndPassword(email, password)
                    .then(cred => {
                        window.location.href = 'index.html';
                    })
                    .catch(err => {
                        // If default admin doesn't exist in Firebase Auth yet, create it
                        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                            auth.createUserWithEmailAndPassword(email, password)
                                .then(cred => {
                                    return db.collection('users').doc(cred.user.uid).set({
                                        username: 'Admin',
                                        email: email,
                                        role: 'admin',
                                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                                    });
                                })
                                .then(() => {
                                    window.location.href = 'index.html';
                                })
                                .catch(createErr => alert(createErr.message));
                        } else {
                            alert(err.message);
                        }
                    });
                return;
            }

            auth.signInWithEmailAndPassword(email, password)
                .then(cred => {
                    console.log('User logged in:', cred.user);
                    window.location.href = 'index.html';
                })
                .catch(err => {
                    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                        alert('Invalid email or password. If you do not have an account, please register first.');
                    } else {
                        alert(err.message);
                    }
                });
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = registerForm['email'].value;
            const password = registerForm['password'].value;
            const username = registerForm['username'].value;
            const confirmPassword = registerForm['confirm-password'].value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then(cred => {
                    // Create user document in Firestore
                    return db.collection('users').doc(cred.user.uid).set({
                        username: username,
                        email: email,
                        role: 'member', // Default role
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    alert('Registration successful!');
                    window.location.href = 'index.html';
                })
                .catch(err => {
                    if (err.code === 'auth/email-already-in-use') {
                        alert('This email is already registered. Please login or use a different email.');
                    } else {
                        alert(err.message);
                    }
                });
        });
    }

    // Monitor Auth State
    auth.onAuthStateChanged(user => {
        const navLinks = document.getElementById('nav-links');
        if (user) {
            console.log('User is signed in');
            // Try to use cached role for immediate rendering
            const cachedRole = localStorage.getItem(`role_${user.uid}`);
            if (cachedRole) {
                renderNav(user, cachedRole);
            }
            updateNavForUser(user);
            
            // Hide landing page content if on index.html
            const hero = document.getElementById('hero-section');
            const welcome = document.getElementById('welcome-section');
            if (hero) hero.classList.add('d-none');
            if (welcome) welcome.classList.remove('d-none');
        } else {
            console.log('User is signed out');
            localStorage.removeItem('userRole'); // Clear legacy
            resetNav();
            
            // Show landing page content if on index.html
            const hero = document.getElementById('hero-section');
            const welcome = document.getElementById('welcome-section');
            if (hero) hero.classList.remove('d-none');
            if (welcome) welcome.classList.add('d-none');
        }
    });

    function resetNav() {
        const navLinks = document.getElementById('nav-links');
        if (navLinks) {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="about.html">About</a></li>
                <li class="nav-item"><a class="nav-link" href="facilities.html">Facilities</a></li>
                <li class="nav-item"><a class="nav-link btn btn-outline-success text-white ms-lg-2" href="login.html">Login</a></li>
                <li class="nav-item"><a class="nav-link btn btn-success text-white ms-lg-2" href="login.html">Admin Login</a></li>
            `;
            navLinks.classList.add('ready');
        }
    }

    function renderNav(user, role) {
        const navLinks = document.getElementById('nav-links');
        if (!navLinks) return;

        let html = '';
        if (role === 'admin') {
            html += `
                <li class="nav-item"><a class="nav-link" href="admin.html">Admin Panel</a></li>
                <li class="nav-item"><a class="nav-link" href="profile.html">Profile</a></li>
            `;
        } else {
            html += `
                <li class="nav-item"><a class="nav-link" href="profile.html">Profile</a></li>
                <li class="nav-item"><a class="nav-link" href="facilities.html">Facilities</a></li>
                <li class="nav-item"><a class="nav-link" href="packages.html">Packages</a></li>
                <li class="nav-item"><a class="nav-link" href="workouts.html">Workout Plan</a></li>
            `;
        }
        html += `<li class="nav-item"><a class="nav-link btn btn-danger text-white ms-lg-2" href="#" id="logout-btn">Logout</a></li>`;
        navLinks.innerHTML = html;
        navLinks.classList.add('ready');

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(`role_${user.uid}`);
                auth.signOut().then(() => {
                    window.location.href = 'index.html';
                });
            });
        }
    }

    function updateNavForUser(user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                localStorage.setItem(`role_${user.uid}`, userData.role);
                renderNav(user, userData.role);
            }
        });
    }
});
