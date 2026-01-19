// Profile Logic
document.addEventListener('DOMContentLoaded', () => {
    const displayName = document.getElementById('display-name');
    const displayEmail = document.getElementById('display-email');
    const userReceipts = document.getElementById('user-receipts');
    const logoutBtn = document.getElementById('logout-btn');
    const photoUpload = document.getElementById('photo-upload');
    const profilePic = document.getElementById('profile-pic');

    let activeListeners = {};

    function clearListeners() {
        Object.values(activeListeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') unsubscribe();
        });
        activeListeners = {};
    }

    // Auth state handled by auth.js
    // We just need to load data when user is available
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                const userData = doc.data();
                const isAdmin = userData && userData.role === 'admin';
                
                clearListeners();
                loadUserProfile(user);
                
                if (!isAdmin) {
                     loadUserReceipts(user);
                     loadUserNotifications();
                     loadUserDiets(user);
                     loadStoreItems();
                 } else {
                     // Remove member-specific sections entirely for admins
                     const memberSide = document.querySelector('.col-md-8');
                     if (memberSide) memberSide.remove();
                     
                     // Center the profile card and remove extra info
                     const profileSide = document.querySelector('.col-md-4');
                     if (profileSide) {
                         profileSide.classList.replace('col-md-4', 'col-md-12');
                         profileSide.querySelector('.card').classList.add('mx-auto');
                         profileSide.querySelector('.card').style.maxWidth = '500px';
                     }
                     
                     const planBadge = document.getElementById('display-plan');
                     const changePhotoBtn = document.querySelector('.btn-outline-primary');
                     const emailDisplay = document.getElementById('display-email');
                     
                     if (planBadge) planBadge.remove();
                     if (emailDisplay) emailDisplay.remove();
                     // Keeping change photo as it's useful for the admin too
                 }
             });
        } else {
            clearListeners();
        }
    });

    function loadUserNotifications() {
        const notifList = document.getElementById('user-notifications');
        activeListeners.notifications = db.collection('notifications').orderBy('date', 'desc').limit(5).onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const n = doc.data();
                html += `
                    <div class="list-group-item">
                        <p class="mb-1">${n.message}</p>
                        <small class="text-muted">${n.date ? n.date.toDate().toLocaleDateString() : ''}</small>
                    </div>
                `;
            });
            if (notifList) notifList.innerHTML = html || '<p class="text-muted">No new notifications.</p>';
        }, err => {
            console.error("User notifications snapshot error:", err);
        });
    }

    function loadUserDiets(user) {
        const dietList = document.getElementById('user-diet-plans');
        activeListeners.diets = db.collection('diets').where('memberId', 'in', [user.uid, '', null]).onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const d = doc.data();
                html += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${d.name}</h6>
                            <button class="btn btn-sm btn-link p-0" onclick="viewDiet('${d.name}', '${d.details.replace(/'/g, "\\'")}')">View Full Plan</button>
                        </div>
                        <p class="small mb-0 text-truncate" style="max-width: 80%;">${d.details}</p>
                    </div>
                `;
            });
            if (dietList) dietList.innerHTML = html || '<p class="text-muted">No diet plans found.</p>';
        }, err => {
            console.error("User diets snapshot error:", err);
        });
    }

    function loadStoreItems() {
        const storeContainer = document.getElementById('user-store-items');
        activeListeners.store = db.collection('store').onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const item = doc.data();
                html += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 border-light shadow-sm">
                            <div class="card-body">
                                <h6 class="card-title">${item.name}</h6>
                                <p class="card-text small text-muted">${item.desc}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <p class="card-text fw-bold text-success mb-0">Rs ${item.price}</p>
                                    <button class="btn btn-sm btn-primary disabled">Available at Gym</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            if (storeContainer) storeContainer.innerHTML = html || '<p class="text-muted">No items available in store.</p>';
        }, err => {
            console.error("Store items snapshot error:", err);
        });
    }

    // Logout logic moved to auth.js

    function loadUserProfile(user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                displayName.textContent = data.username;
                displayEmail.textContent = data.email;
                if (data.membershipPlan) {
                    const planBadge = document.getElementById('display-plan');
                    if (planBadge) {
                        planBadge.textContent = data.membershipPlan + ' Plan';
                        planBadge.classList.replace('bg-primary', 'bg-success');
                    }
                }
                if (data.photoURL) {
                    profilePic.src = data.photoURL;
                }
            }
        });
    }

    function loadUserReceipts(user) {
        activeListeners.receipts = db.collection('receipts').where('memberId', '==', user.uid).onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const receipt = doc.data();
                const date = receipt.date ? receipt.date.toDate().toLocaleDateString() : 'Pending...';
                const receiptImgBtn = receipt.receiptURL ? 
                    `<button class="btn btn-sm btn-outline-info" onclick="viewReceipt('${receipt.receiptURL}')">View Image</button>` : 
                    '<span class="text-muted small">No image</span>';
                
                html += `
                    <tr>
                        <td>${date}</td>
                        <td>Rs ${receipt.amount}</td>
                        <td><span class="badge bg-success">${receipt.status}</span></td>
                        <td>
                            ${receiptImgBtn}
                        </td>
                    </tr>
                `;
            });
            if (userReceipts) {
                userReceipts.innerHTML = html || '<tr><td colspan="4" class="text-center">No receipts found.</td></tr>';
            }
        }, err => {
            console.error("User receipts snapshot error:", err);
        });
    }

    // Add viewReceipt function to global scope
    window.viewReceipt = (url) => {
        const win = window.open();
        win.document.write(`<img src="${url}" style="max-width: 100%; height: auto;" />`);
    };

    window.viewDiet = (name, details) => {
        alert(`${name}\n\n${details}`);
    };

    // Handle Photo Upload
    if (photoUpload) {
        photoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Check file size (Firestore document limit is 1MB, so we should keep Base64 around 500KB-700KB)
            if (file.size > 700000) {
                alert('File is too large. Please select an image under 700KB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                const user = auth.currentUser;

                db.collection('users').doc(user.uid).update({
                    photoURL: base64String
                }).then(() => {
                    profilePic.src = base64String;
                    alert('Profile picture updated successfully!');
                }).catch(err => {
                    console.error("Error updating profile picture:", err);
                    alert('Error: ' + err.message);
                });
            };
            reader.readAsDataURL(file);
        });
    }
});
