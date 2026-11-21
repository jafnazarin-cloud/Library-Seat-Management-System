
const LIBRARY_OPEN_HOUR = 8;

const LIBRARY_CLOSE_HOUR = 17;

let selectedSeatId = null;

let currentFilterMode = 'all';

let cancelMode = false;


// Elements

const bookingModal = document.getElementById("bookingModal");

const bookingBox = document.querySelector(".booking-box");

const bookingMessage = document.getElementById("bookingMessage");


// 1. Live Digital Clock

function updateDigitalClock() {

    const now = new Date();

    let hours = now.getHours();

    let minutes = String(now.getMinutes()).padStart(2, "0");

    let seconds = String(now.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    document.getElementById("liveClock").textContent =
        `Live: ${hours}:${minutes}:${seconds} ${ampm}`;

}

setInterval(updateDigitalClock, 1000);


// 2. Dark Mode

function toggleTheme() {

    document.body.classList.toggle("dark-mode");

    const themeBtn = document.getElementById("themeToggle");

    if (document.body.classList.contains("dark-mode")) {

        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';

        localStorage.setItem("theme", "dark");

    } else {

        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';

        localStorage.setItem("theme", "light");

    }

}


// 3. Show Booking Popup

function handleSeatClick(element) {

    selectedSeatId = element.id;

    // Already booked seat

    if (element.classList.contains("booked")) {

        showCancelPopup();

        return;

    }

    // Library time check

    let currentHour = new Date().getHours();

    if (currentHour < LIBRARY_OPEN_HOUR ||
        currentHour >= LIBRARY_CLOSE_HOUR) {

        resetBookingForm();

        bookingMessage.textContent = "Library is open from 8 AM to 5 PM.";

        bookingModal.style.display = "flex";

        return;

    }

    // Reset form

    resetBookingForm();

    bookingBox.querySelector("h2").textContent = "Book Your Seat";

    // Show popup

    bookingModal.style.display = "flex";

}


// 4. Reset Booking Form

function resetBookingForm() {

    document.getElementById("studentName").value = "";

    document.getElementById("studentId").value = "";

    document.getElementById("bookingTime").value = "";

    bookingMessage.textContent = "";

}


// 5. Confirm Booking

function confirmBooking() {

    let name = document.getElementById("studentName").value.trim();

    let id = document.getElementById("studentId").value.trim();

    let time = document.getElementById("bookingTime").value;

    let message = document.getElementById("bookingMessage");

    if (!name || !id || !time) {

        message.textContent = "Please fill all fields.";

        return;

    }

    let expiryTime = parseTimeStringToDate(time);

    if (!expiryTime || expiryTime <= Date.now()) {

        message.textContent = "Please select a future time.";

        return;

    }

    let expiryDate = new Date(expiryTime);

    if (expiryDate.getHours() > LIBRARY_CLOSE_HOUR ||
        (expiryDate.getHours() === LIBRARY_CLOSE_HOUR &&
         expiryDate.getMinutes() > 0)) {

        message.textContent = "Booking cannot exceed 5 PM.";

        return;

    }

    let seat = document.getElementById(selectedSeatId);

    if (!seat || seat.classList.contains("booked")) {

        message.textContent = "Seat is not available.";

        return;

    }

    let bookingData = {

        name: name,

        id: id,

        displayTime: time,

        expiresAt: expiryTime

    };

    localStorage.setItem(
        selectedSeatId,
        JSON.stringify(bookingData)
    );

    updateSeatDisplay(selectedSeatId, bookingData);

    startAutoReleaseTimer(
        selectedSeatId,
        expiryTime - Date.now()
    );

    closeBookingModal();

    updateLiveCounter();

    filterSeats(currentFilterMode);

}


// 6. Convert Time

function parseTimeStringToDate(timeStr) {

    const parts = timeStr.split(":");

    if (parts.length !== 2) return null;

    const hours = Number(parts[0]);

    const minutes = Number(parts[1]);

    if (!Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 || hours > 23 ||
        minutes < 0 || minutes > 59) {

        return null;

    }

    const now = new Date();

    const targetDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
    );

    return targetDate.getTime();

}


// 7. Update Seat Display

function updateSeatDisplay(seatId, booking) {

    const seat = document.getElementById(seatId);

    if (!seat) return;

    seat.classList.add("booked");

    seat.innerHTML = "";

    const icon = document.createElement("i");

    icon.className = "fa-solid fa-user-lock";

    const span = document.createElement("span");

    span.textContent =
        `${booking.name} | ID: ${booking.id} | Until ${booking.displayTime}`;

    seat.appendChild(icon);

    seat.appendChild(span);

}


// 8. Cancel Booking Popup

function showCancelPopup() {

    cancelMode = true;

    const fields = bookingBox.querySelectorAll("label, input");

    const buttons = bookingBox.querySelectorAll("button");

    fields.forEach(field => field.style.display = "none");

    bookingBox.querySelector("h2").textContent = "Cancel Booking?";

    bookingMessage.textContent =
        "Do you want to cancel this seat booking?";

    buttons[0].style.display = "none";

    buttons[1].textContent = "Keep Booking";

    buttons[1].onclick = closeBookingModal;

    let confirmButton = document.getElementById("confirmCancelButton");

    if (!confirmButton) {

        confirmButton = document.createElement("button");

        confirmButton.id = "confirmCancelButton";

        confirmButton.textContent = "Yes, Cancel Booking";

        bookingBox.appendChild(confirmButton);

    }

    confirmButton.style.display = "block";

    confirmButton.onclick = function () {

        releaseSeat(selectedSeatId);

        closeBookingModal();

        updateLiveCounter();

        filterSeats(currentFilterMode);

    };

    bookingModal.style.display = "flex";

}


// 9. Close Popup

function closeBookingModal() {

    bookingModal.style.display = "none";

    const fields = bookingBox.querySelectorAll("label, input");

    fields.forEach(field => field.style.display = "block");

    const buttons = bookingBox.querySelectorAll("button");

    buttons[0].style.display = "block";

    buttons[1].style.display = "block";

    const confirmButton =
        document.getElementById("confirmCancelButton");

    if (confirmButton) {

        confirmButton.style.display = "none";

    }

    bookingBox.querySelector("h2").textContent = "Book Your Seat";

    bookingMessage.textContent = "";

    buttons[0].textContent = "Book Seat";

    buttons[0].onclick = confirmBooking;

    buttons[1].textContent = "Cancel";

    buttons[1].onclick = closeBookingModal;

    cancelMode = false;

    selectedSeatId = null;

}


// 10. Release Seat

function releaseSeat(seatId) {

    const seat = document.getElementById(seatId);

    if (!seat) return;

    seat.classList.remove("booked");

    const seatNumber = seatId.replace("seat-", "");

    seat.innerHTML =
        `<i class="fa-solid fa-chair"></i><span>Seat ${seatNumber}</span>`;

    localStorage.removeItem(seatId);

}


// 11. Automatic Booking Expiry

function startAutoReleaseTimer(seatId, delay) {

    setTimeout(() => {

        const savedData = localStorage.getItem(seatId);

        if (!savedData) return;

        const booking = JSON.parse(savedData);

        if (Date.now() >= booking.expiresAt) {

            releaseSeat(seatId);

            updateLiveCounter();

            filterSeats(currentFilterMode);

        }

    }, Math.max(0, delay));

}


// 12. Update Counters

function updateLiveCounter() {

    const totalSeats = 10;

    const bookedSeats =
        document.querySelectorAll(".seat-btn.booked").length;

    document.getElementById("totalNum").textContent = totalSeats;

    document.getElementById("bookedNum").textContent = bookedSeats;

    document.getElementById("freeNum").textContent =
        totalSeats - bookedSeats;

}


// 13. Filter Seats

function filterSeats(type) {

    currentFilterMode = type;

    const allSeats = document.querySelectorAll(".seat-btn");

    ["all", "free", "booked"].forEach(filter => {

        const button = document.getElementById(`filter-${filter}`);

        if (button) {

            button.classList.toggle("active", filter === type);

        }

    });

    allSeats.forEach(seat => {

        if (type === "all") {

            seat.classList.remove("hidden");

        }

        else if (type === "free") {

            seat.classList.toggle("hidden",
                seat.classList.contains("booked"));

        }

        else if (type === "booked") {

            seat.classList.toggle("hidden",
                !seat.classList.contains("booked"));

        }

    });

}


// 14. Load Saved Data

window.onload = function () {

    updateDigitalClock();

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark-mode");

        document.getElementById("themeToggle").innerHTML =
            '<i class="fa-solid fa-sun"></i> Light Mode';

    }

    document.querySelectorAll(".seat-btn").forEach(seat => {

        const savedData = localStorage.getItem(seat.id);

        if (savedData) {

            try {

                const booking = JSON.parse(savedData);

                if (Date.now() >= booking.expiresAt) {

                    localStorage.removeItem(seat.id);

                } else {

                    updateSeatDisplay(seat.id, booking);

                    startAutoReleaseTimer(
                        seat.id,
                        booking.expiresAt - Date.now()
                    );

                }

            } catch (error) {

                localStorage.removeItem(seat.id);

            }

        }

    });

    updateLiveCounter();

    filterSeats("all");

};
