const API_URL = "http://localhost:3000/cars";
const BOOK_URL = "http://localhost:3000/bookings";
let base64Image = "";
let carModal;

document.addEventListener('DOMContentLoaded', () => { 
    carModal = new bootstrap.Modal(document.getElementById('carModal'));
    loadTable(); 
    loadBookings(); 

    // Handle Image Selection
    document.getElementById('carImageFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            base64Image = reader.result;
            document.getElementById('livePreview').src = base64Image;
            document.getElementById('previewWrap').classList.remove('d-none');
        };
        if (file) reader.readAsDataURL(file);
    });
});

// --- 1. LOAD VEHICLES ---
async function loadTable() {
    const res = await fetch(API_URL); 
    const cars = await res.json();
    document.getElementById('adminTable').innerHTML = cars.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>Rs. ${Number(c.price).toLocaleString()}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-info me-2" onclick="editCar('${c.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${c.id}', 'cars')">Delete</button>
            </td>
        </tr>`).join('');
    calculateStats(cars);
}

// --- 2. LOAD BOOKINGS (WITH CONFIRM BUTTON) ---
async function loadBookings() {
    const res = await fetch(BOOK_URL); 
    const books = await res.json();
    document.getElementById('bookingsTable').innerHTML = books.reverse().map(b => `
        <tr>
            <td>${b.customerName}</td>
            <td>${b.carName}</td>
            <td><small>${b.pickupDate || 'N/A'} to ${b.returnDate || 'N/A'}</small></td>
            <td>${b.totalAmount ? b.totalAmount.replace('$', 'Rs. ') : 'Rs. 0'}</td> 
            <td>
                <span class="badge ${b.status === 'Confirmed' ? 'bg-success' : 'bg-warning'} text-dark">
                    ${b.status || 'Pending'}
                </span>
            </td>
            <td>
                ${b.status !== 'Confirmed' ? 
                    `<button class="btn btn-sm btn-success me-1" onclick="confirmBooking('${b.id}')">Confirm</button>` : 
                    ''
                }
                <button class="btn btn-sm btn-danger" onclick="deleteItem('${b.id}', 'bookings')">Remove</button>
            </td>
        </tr>`).join('');
    document.getElementById('statBooks').innerText = books.length;
}

// --- 3. SAVE / UPDATE LOGIC ---
async function saveCar() {
    const id = document.getElementById('editCarId').value;
    const data = {
        name: document.getElementById('newCarName').value,
        brand: document.getElementById('newCarBrand').value,
        price: document.getElementById('newCarPrice').value,
        image: base64Image || "https://via.placeholder.com/500"
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    const res = await fetch(url, {
        method: method,
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
    });
    
    if(res.ok) {
        carModal.hide();
        loadTable();
    }
}

// --- 4. EDIT LOGIC ---
async function editCar(id) {
    const res = await fetch(`${API_URL}/${id}`);
    const car = await res.json();

    document.getElementById('editCarId').value = car.id;
    document.getElementById('newCarName').value = car.name;
    document.getElementById('newCarBrand').value = car.brand;
    document.getElementById('newCarPrice').value = car.price;
    
    document.getElementById('modalTitle').innerText = "Edit Vehicle";
    document.getElementById('saveBtn').innerText = "Update Vehicle";
    
    if(car.image) {
        document.getElementById('livePreview').src = car.image;
        document.getElementById('previewWrap').classList.remove('d-none');
        base64Image = car.image;
    }
    carModal.show();
}

// --- 5. DELETE LOGIC ---
async function deleteItem(id, type) {
    if (!confirm(`Are you sure you want to delete this ${type === 'cars' ? 'vehicle' : 'booking'}?`)) return;

    const url = type === 'cars' ? `${API_URL}/${id}` : `${BOOK_URL}/${id}`;
    
    await fetch(url, { method: 'DELETE' });
    if (type === 'cars') loadTable();
    else loadBookings();
}

// --- 6. CONFIRM BOOKING LOGIC ---
async function confirmBooking(id) {
    if (!confirm("Are you sure you want to confirm this booking?")) return;

    try {
        const res = await fetch(`${BOOK_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "Confirmed" })
        });

        if (res.ok) {
            loadBookings(); // Refresh table to show green badge
        }
    } catch (error) {
        console.error("Confirmation failed:", error);
    }
}

// --- HELPERS ---
function openAddModal() {
    document.getElementById('adminForm').reset();
    document.getElementById('editCarId').value = "";
    document.getElementById('modalTitle').innerText = "Add New Vehicle";
    document.getElementById('saveBtn').innerText = "Save to Fleet";
    removeImg();
    carModal.show();
}

function removeImg() {
    base64Image = "";
    document.getElementById('carImageFile').value = "";
    document.getElementById('previewWrap').classList.add('d-none');
}

function calculateStats(cars) {
    document.getElementById('statFleet').innerText = cars.length;
    const totalRev = cars.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    document.getElementById('statRev').innerText = totalRev.toLocaleString();
}