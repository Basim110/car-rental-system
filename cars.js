const API_URL = "http://localhost:3000/cars";
const BOOK_URL = "http://localhost:3000/bookings";
let modal;

document.addEventListener('DOMContentLoaded', () => {
    const modalElement = document.getElementById('bookingModal');
    if (modalElement) {
        modal = new bootstrap.Modal(modalElement);
    }

    // Attach Listeners
    document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);
    
    // Search/Filter as you type
    document.getElementById('nameFilter').addEventListener('input', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('priceFilter').addEventListener('input', applyFilters);
    document.getElementById('sortOrder').addEventListener('change', applyFilters);

    fetchCars();
});

// --- FETCH AND RENDER CARS ---
async function fetchCars(query = "") {
    const container = document.getElementById('cars-container');
    container.innerHTML = '<div class="text-center w-100 mt-5"><div class="spinner-border text-warning"></div><p>Loading fleet...</p></div>';

    try {
        const res = await fetch(API_URL + query);
        if (!res.ok) throw new Error("Server response not ok");
        
        let cars = await res.json();

        container.innerHTML = ""; // Clear loader
        
        if (cars.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center mt-5">
                    <i class="bi bi-search fs-1 text-muted"></i>
                    <h4 class="mt-3">No cars found matching your search.</h4>
                    <button class="btn btn-outline-warning btn-sm" onclick="resetFilters()">Clear all filters</button>
                </div>`;
            return;
        }

        container.innerHTML = cars.map(car => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm car-card">
                    <img src="${car.image}" class="card-img-top" style="height:200px; object-fit:cover;" alt="${car.name}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-light text-dark border">${car.type}</span>
                            <span class="fw-bold text-success">Rs. ${Number(car.price).toLocaleString()}/day</span>
                        </div>
                        <h5 class="fw-bold mb-1">${car.name}</h5>
                        <p class="small text-muted mb-3"><i class="bi bi-tag"></i> ${car.brand || 'Luxury'}</p>
                        <button class="btn btn-warning w-100 fw-bold py-2"
                            onclick="openBookingModal('${car.name}', ${car.price})">
                            Rent Now
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Fetch Error:", error);
        container.innerHTML = '<div class="col-12 text-center text-danger mt-5"><h4>Error connecting to server. Please ensure JSON-server is running.</h4></div>';
    }
}

// --- APPLY FILTERS ---
function applyFilters() {
    const name = document.getElementById('nameFilter').value.trim();
    const type = document.getElementById('typeFilter').value;
    const price = document.getElementById('priceFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;

    let params = new URLSearchParams();

    // name_like works for partial matches in modern json-server
    if (name) params.append('name_like', name); 
    if (type) params.append('type', type);
    if (price) params.append('price_lte', price);
    
    // Updated sorting syntax for JSON-Server 1.0+
    if (sortOrder) {
        // 'price' for ascending, '-price' for descending
        const sortValue = sortOrder === 'asc' ? 'price' : '-price';
        params.append('_sort', sortValue);
    }

    const queryString = params.toString();
    fetchCars(queryString ? "?" + queryString : "");
}

// --- RESET FILTERS ---
function resetFilters() {
    document.getElementById('nameFilter').value = "";
    document.getElementById('typeFilter').value = "";
    document.getElementById('priceFilter').value = "";
    document.getElementById('sortOrder').value = "";
    fetchCars();
}

// --- BOOKING MODAL ---
function openBookingModal(name, price) {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        alert("Please login to rent a vehicle.");
        window.location.href = "login.html";
        return;
    }

    document.getElementById('bookCarName').value = name;
    document.getElementById('bookCarPrice').value = price;
    document.getElementById('displayPricePerDay').textContent = `Rs. ${price}`;

    document.getElementById('startDate').value = "";
    document.getElementById('endDate').value = "";
    document.getElementById('displayTotalDays').textContent = "0";
    document.getElementById('displayTotalAmount').textContent = "Rs. 0";

    modal.show();
}

// --- CALCULATION LOGIC ---
function calculateTotal() {
    const startInput = document.getElementById('startDate').value;
    const endInput = document.getElementById('endDate').value;
    const pricePerDay = parseFloat(document.getElementById('bookCarPrice').value) || 0;

    if (startInput && endInput) {
        const start = new Date(startInput);
        const end = new Date(endInput);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            const total = diffDays * pricePerDay;
            document.getElementById('displayTotalDays').textContent = diffDays;
            document.getElementById('displayTotalAmount').textContent = `Rs. ${total.toLocaleString()}`;
        } else {
            document.getElementById('displayTotalDays').textContent = "0";
            document.getElementById('displayTotalAmount').textContent = "Invalid Dates";
        }
    }
}

// --- SUBMIT BOOKING ---
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));

    if (days <= 0) {
        alert("Please select valid pickup and return dates.");
        return;
    }

    const bookingData = {
        userId: sessionStorage.getItem('userId'),
        username: sessionStorage.getItem('username'),
        carName: document.getElementById('bookCarName').value,
        pickupDate: start,
        returnDate: end,
        days: days,
        totalAmount: document.getElementById('displayTotalAmount').textContent,
        customerName: document.getElementById('userName').value,
        phone: document.getElementById('userPhone').value,
        idCard: document.getElementById('userIdCard').value,
        status: "Pending",
        date: new Date().toLocaleDateString()
    };

    try {
        const res = await fetch(BOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (res.ok) {
            alert("Booking submitted successfully! Our team will contact you soon.");
            modal.hide();
            e.target.reset();
        }
    } catch (error) {
        alert("Connection error. Is json-server running?");
    }
});