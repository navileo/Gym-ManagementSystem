// Admin Panel Logic
document.addEventListener('DOMContentLoaded', () => {
    const membersList = document.getElementById('members-list');
    const addMemberForm = document.getElementById('add-member-form');
    const editMemberForm = document.getElementById('edit-member-form');
    const createBillForm = document.getElementById('create-bill-form');
    const logoutBtn = document.getElementById('logout-btn');

    let activeListeners = {};

    function clearListeners() {
        Object.values(activeListeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') unsubscribe();
        });
        activeListeners = {};
    }

    // Check if user is admin
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (!doc.exists || doc.data().role !== 'admin') {
                    alert('Access denied. Admins only.');
                    window.location.href = 'index.html';
                } else {
                    clearListeners();
                    loadInitialData();
                }
            });
        } else {
            clearListeners();
            window.location.href = 'login.html';
        }
    });

    // Auth state check handled by auth.js and this local check
    // Logout handled by auth.js

    // Load Data
    function loadInitialData() {
        loadMembers();
        loadNotifications();
        loadStoreItems();
        loadDietPlans();
        loadAllReceipts();
    }

    // Load All Receipts for Admin
    function loadAllReceipts() {
        const receiptsList = document.getElementById('receipts-list');
        activeListeners.receipts = db.collection('receipts').orderBy('date', 'desc').onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const r = doc.data();
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Member: ${r.memberId}</strong> - Rs ${r.amount}
                            <br><small class="text-muted">${r.date ? r.date.toDate().toLocaleDateString() : 'Pending'}</small>
                        </div>
                        <div>
                            ${r.receiptURL ? `<a href="${r.receiptURL}" target="_blank" class="btn btn-sm btn-outline-info me-2">View</a>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="deleteDoc('receipts', '${doc.id}')">Delete</button>
                        </div>
                    </li>
                `;
            });
            if (receiptsList) receiptsList.innerHTML = html || '<p class="text-muted">No receipts found.</p>';
        }, err => console.error("Receipts snapshot error:", err));
    }

    // Export Reports
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline-secondary mb-3';
    exportBtn.innerText = 'Export Members CSV';
    exportBtn.onclick = () => {
        db.collection('users').get().then(snapshot => {
            let csv = 'Name,Email,Role,CreatedAt\n';
            snapshot.forEach(doc => {
                const u = doc.data();
                csv += `${u.username},${u.email},${u.role},${u.createdAt ? u.createdAt.toDate().toISOString() : ''}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'gym_members_report.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    };
    const membersTab = document.getElementById('members');
    if (membersTab) membersTab.insertBefore(exportBtn, membersTab.firstChild);

    // Logging helper
    function logAction(userId, action, details) {
        db.collection('audit_logs').add({
            userId: userId,
            action: action,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // Load Notifications
    function loadNotifications() {
        const adminNotifList = document.getElementById('admin-notif-list');
        activeListeners.notifications = db.collection('notifications').orderBy('date', 'desc').onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const n = doc.data();
                html += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <p class="mb-1">${n.message}</p>
                            <small>${n.date ? n.date.toDate().toLocaleDateString() : 'Now'}</small>
                        </div>
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteDoc('notifications', '${doc.id}')">Delete</button>
                    </div>
                `;
            });
            if (adminNotifList) adminNotifList.innerHTML = html || '<p class="text-muted">No notifications sent.</p>';
        }, err => {
            console.error("Notifications snapshot error:", err);
        });
    }

    // Send Notification
    const sendNotifForm = document.getElementById('send-notification-form');
    if (sendNotifForm) {
        sendNotifForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = document.getElementById('notif-message').value;
            db.collection('notifications').add({
                message: msg,
                date: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert('Notification sent to all members!');
                sendNotifForm.reset();
            });
        });
    }

    // Store Logic
    function loadStoreItems() {
        const storeList = document.getElementById('admin-store-list');
        activeListeners.store = db.collection('store').onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const item = doc.data();
                html += `
                    <tr>
                        <td>${item.name}</td>
                        <td>Rs ${item.price}</td>
                        <td>${item.desc}</td>
                        <td><button class="btn btn-sm btn-danger" onclick="deleteDoc('store', '${doc.id}')">Remove</button></td>
                    </tr>
                `;
            });
            if (storeList) storeList.innerHTML = html;
        }, err => {
            console.error("Store snapshot error:", err);
        });
    }

    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('store').add({
                name: document.getElementById('item-name').value,
                price: document.getElementById('item-price').value,
                desc: document.getElementById('item-desc').value
            }).then(() => {
                alert('Item added to store!');
                addItemForm.reset();
                bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
            });
        });
    }

    // Diet Logic
    function loadDietPlans() {
        const dietList = document.getElementById('admin-diet-list');
        activeListeners.diets = db.collection('diets').onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const diet = doc.data();
                html += `
                    <tr>
                        <td>${diet.name}</td>
                        <td>${diet.memberId || 'General'}</td>
                        <td>${diet.details.substring(0, 30)}...</td>
                        <td><button class="btn btn-sm btn-danger" onclick="deleteDoc('diets', '${doc.id}')">Remove</button></td>
                    </tr>
                `;
            });
            if (dietList) dietList.innerHTML = html;
        }, err => {
            console.error("Diets snapshot error:", err);
        });
    }

    const addDietForm = document.getElementById('add-diet-form');
    if (addDietForm) {
        addDietForm.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('diets').add({
                name: document.getElementById('diet-name').value,
                memberId: document.getElementById('diet-member-id').value,
                details: document.getElementById('diet-details').value
            }).then(() => {
                alert('Diet plan saved!');
                addDietForm.reset();
                bootstrap.Modal.getInstance(document.getElementById('addDietModal')).hide();
            });
        });
    }

    // Global delete helper
    window.deleteDoc = (coll, id) => {
        if (confirm('Are you sure?')) {
            db.collection(coll).doc(id).delete();
        }
    };

    // Load Members
    function loadMembers() {
        activeListeners.members = db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const user = doc.data();
                html += `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-info'}">${user.role}</span></td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editUser('${doc.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            if (membersList) membersList.innerHTML = html;
        }, err => {
            console.error("Members snapshot error:", err);
        });
    }

    // Add Member
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('new-member-name').value;
            const email = document.getElementById('new-member-email').value;
            const password = document.getElementById('new-member-password').value;

            // In a real app, this should be done via Firebase Admin SDK or Cloud Function
            // For this demo, we'll use regular createUser (which will log the admin out temporarily)
            // Ideally, use a Cloud Function to create users without logging out.
            alert('Member creation via Cloud Functions is recommended. Redirecting to register for demo.');
            window.location.href = 'register.html';
        });
    }

    // Edit Member
    if (editMemberForm) {
        editMemberForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-user-id').value;
            const username = document.getElementById('edit-username').value;
            const email = document.getElementById('edit-email').value;
            const role = document.getElementById('edit-role').value;

            db.collection('users').doc(id).update({
                username: username,
                email: email,
                role: role
            }).then(() => {
                alert('Member updated successfully!');
                bootstrap.Modal.getInstance(document.getElementById('editMemberModal')).hide();
            }).catch(error => {
                console.error("Error updating user: ", error);
                alert("Error updating member.");
            });
        });
    }

    // Billing Logic
    if (createBillForm) {
        createBillForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const memberId = document.getElementById('bill-member-id').value;
            const amount = document.getElementById('bill-amount').value;
            const receiptImg = document.getElementById('bill-receipt-img').files[0];

            const saveReceipt = (imgBase64 = null) => {
                db.collection('receipts').add({
                    memberId: memberId,
                    amount: amount,
                    receiptURL: imgBase64,
                    date: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'Paid'
                }).then(() => {
                    alert('Receipt generated successfully!');
                    createBillForm.reset();
                }).catch(err => alert(err.message));
            };

            if (receiptImg) {
                if (receiptImg.size > 700000) {
                    alert('Receipt image is too large. Please keep it under 700KB.');
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => saveReceipt(reader.result);
                reader.readAsDataURL(receiptImg);
            } else {
                saveReceipt();
            }
        });
    }
});

// Global functions for actions
window.editUser = (id) => {
    db.collection('users').doc(id).get().then(doc => {
        if (doc.exists) {
            const user = doc.data();
            document.getElementById('edit-user-id').value = id;
            document.getElementById('edit-username').value = user.username || '';
            document.getElementById('edit-email').value = user.email || '';
            document.getElementById('edit-role').value = user.role || 'member';
            
            const editModal = new bootstrap.Modal(document.getElementById('editMemberModal'));
            editModal.show();
        } else {
            alert("User not found!");
        }
    }).catch(error => {
        console.error("Error fetching user: ", error);
    });
};

window.deleteUser = (id) => {
    if (confirm('Are you sure you want to delete this member?')) {
        db.collection('users').doc(id).delete().then(() => {
            alert('Member deleted');
        });
    }
};
