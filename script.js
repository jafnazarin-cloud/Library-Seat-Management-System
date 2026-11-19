const LIBRARY_OPEN_HOUR = 8;   
const LIBRARY_CLOSE_HOUR = 17; 
let currentFilterMode = 'all'; // গ্লোবাল ফিল্টার স্টেট

// ১. লাইভ ডিজিটাল ঘড়ি চালুর ফাংশন
function updateDigitalClock() {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    
    document.getElementById("liveClock").innerHTML = `<i class="fa-solid fa-circle-dot"></i> Live: ${hours}:${minutes}:${seconds} ${ampm}`;
}
setInterval(updateDigitalClock, 1000); 

// ২. ডার্ক মোড থিম চেঞ্জ করার ফাংশন
function toggleTheme() {
    let body = document.body;
    let themeBtn = document.getElementById("themeToggle");
    
    body.classList.toggle("dark-mode");
    
    if (body.classList.contains("dark-mode")) {
        themeBtn.innerHTML = `<i class="fa-solid fa-sun"></i> Light Mode`;
        localStorage.setItem("theme", "dark");
    } else {
        themeBtn.innerHTML = `<i class="fa-solid fa-moon"></i> Dark Mode`;
        localStorage.setItem("theme", "light");
    }
}

// ৩. সিট ক্লিক লজিক
function handleSeatClick(element) {
    let nowTime = new Date();
    let currentHour = nowTime.getHours();

    if (element.classList.contains("booked")) {
        let confirmCancel = confirm("আপনি কি এই সিটের বুকিং এখনই বাতিল করতে চান?");
        if (confirmCancel) {
            releaseSeat(element.id);
        }
        updateLiveCounter();
        filterSeats(currentFilterMode); // ফিল্টার রি-অ্যাপ্লাই করা
        return; 
    }

    if (currentHour < LIBRARY_OPEN_HOUR || currentHour >= LIBRARY_CLOSE_HOUR) {
        alert("দুঃখিত! লাইব্রেরি এখন বন্ধ। লাইব্রেরি খোলা থাকে সকাল ৮:০০ টা থেকে বিকাল ৫:০০ টা পর্যন্ত।");
        return;
    }

    let nameInput = prompt("বুকিং করার জন্য আপনার নাম লিখুন:");
    if (nameInput === null || nameInput.trim() === "") return; 

    let idInput = prompt("আপনার আইডি নম্বর লিখুন:");
    if (idInput === null || idInput.trim() === "") {
        alert("বুকিং সম্পূর্ণ করতে আইডি নম্বর প্রয়োজন!");
        return;
    }

    let timeInput = prompt("কোন সময় পর্যন্ত বুক করতে চান? (উদাহরণ: 04:30 PM অথবা 16:30)");
    if (timeInput === null || timeInput.trim() === "") {
        alert("দয়া করে একটি সঠিক সময় দিন!");
        return;
    }

    let expiryTime = parseTimeStringToDate(timeInput.trim());
    if (!expiryTime) {
        alert("সময়ের ফরম্যাটটি সঠিক নয়! দয়া করে '04:00 PM' অথবা '16:00' ফরম্যাটে লিখুন।");
        return;
    }

    let now = new Date().getTime();
    if (expiryTime <= now) {
        alert("আপনি যে সময়টি দিয়েছেন তা ইতিমধ্যে পার হয়ে গেছে! ভবিষ্যতের কোনো সময় দিন।");
        return;
    }

    let expiryDateObject = new Date(expiryTime);
    if (expiryDateObject.getHours() > LIBRARY_CLOSE_HOUR || (expiryDateObject.getHours() === LIBRARY_CLOSE_HOUR && expiryDateObject.getMinutes() > 0)) {
        alert("দুঃখিত! আপনি লাইব্রেরি বন্ধের (বিকাল ৫:০০ টার) পরের সময় দিতে পারবেন না।");
        return;
    }

    let userName = nameInput.trim();
    let userId = idInput.trim();
    let displayTime = timeInput.trim().toUpperCase();

    let seatBookingData = {
        name: userName,
        id: userId,
        displayTime: displayTime,
        expiresAt: expiryTime
    };

    localStorage.setItem(element.id, JSON.stringify(seatBookingData));
    
    element.classList.add("booked");
    element.innerHTML = `<i class="fa-solid fa-user-lock"></i><span>${userName}<br>ID: ${userId}<br>Until ${displayTime}</span>`;

    let timeDifference = expiryTime - now;
    startAutoReleaseTimer(element.id, timeDifference);
    updateLiveCounter();
    filterSeats(currentFilterMode); // ফিল্টার রি-অ্যাপ্লাই করা
}

function parseTimeStringToDate(timeStr) {
    let now = new Date();
    let hours = 0, minutes = 0;
    
    let is12Hour = /am|pm/i.test(timeStr);
    let timeParts = timeStr.replace(/am|pm/i, '').trim().split(':');
    if (timeParts.length < 1) return null;
    
    hours = parseInt(timeParts[0]);
    minutes = timeParts[1] ? parseInt(timeParts[1]) : 0;
    
    if (isNaN(hours) || isNaN(minutes)) return null;

    if (is12Hour) {
        let isPM = /pm/i.test(timeStr);
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
    }

    let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    return targetDate.getTime();
}

function releaseSeat(seatId) {
    let element = document.getElementById(seatId);
    element.classList.remove("booked"); 
    
    let seatNum = seatId.replace("seat-", "");
    element.innerHTML = `<i class="fa-solid fa-chair"></i><span>Seat ${seatNum}</span>`;
    
    localStorage.removeItem(seatId); 
    updateLiveCounter(); 
}

function startAutoReleaseTimer(seatId, delayInMs) {
    setTimeout(() => {
        let savedData = localStorage.getItem(seatId);
        if (savedData) {
            let booking = JSON.parse(savedData);
            let now = new Date().getTime();
            
            if (now >= booking.expiresAt) {
                releaseSeat(seatId);
                filterSeats(currentFilterMode);
                alert(`Seat ${seatId.replace("seat-", "")} এর বুকিং সময় শেষ! সিটটি এখন খালি।`);
            }
        }
    }, delayInMs);
}

function updateLiveCounter() {
    let totalSeats = 10; 
    let currentlyBooked = document.querySelectorAll(".seat-btn.booked").length;
    
    document.getElementById("totalNum").innerText = totalSeats;
    document.getElementById("bookedNum").innerText = currentlyBooked;
    document.getElementById("freeNum").innerText = totalSeats - currentlyBooked;
}

// ৪. স্মার্ট আসন ফিল্টারিং ফাংশন (নতুন ফিচার)
function filterSeats(type) {
    currentFilterMode = type;
    let allSeats = document.querySelectorAll(".seat-btn");
    
    // সব ফিল্টার বাটনের অ্যাক্টিভ ক্লাস রিমুভ করা
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    // সিলেক্টেড বাটনে অ্যাক্টিভ ক্লাস অ্যাড করা
    document.getElementById(`filter-${type}`).classList.add("active");

    allSeats.forEach(seat => {
        if (type === 'all') {
            seat.classList.remove("hidden");
        } else if (type === 'free') {
            if (seat.classList.contains("booked")) {
                seat.classList.add("hidden");
            } else {
                seat.classList.remove("hidden");
            }
        } else if (type === 'booked') {
            if (!seat.classList.contains("booked")) {
                seat.classList.add("hidden");
            } else {
                seat.classList.remove("hidden");
            }
        }
    });
}

// ৫. উইন্ডো লোড
window.onload = function() {
    updateDigitalClock();
    
    // সংরক্ষিত থিম লোড করা
    let savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        document.getElementById("themeToggle").innerHTML = `<i class="fa-solid fa-sun"></i> Light Mode`;
    }

    let allSeats = document.querySelectorAll(".seat-btn");
    let now = new Date().getTime();
    
    allSeats.forEach(seat => {
        let savedData = localStorage.getItem(seat.id);
        if (savedData) {
            try {
                let booking = JSON.parse(savedData);
                
                if (now >= booking.expiresAt) {
                    localStorage.removeItem(seat.id);
                } else {
                    seat.classList.add("booked");
                    seat.innerHTML = `<i class="fa-solid fa-user-lock"></i><span>${booking.name}<br>ID: ${booking.id}<br>Until ${booking.displayTime}</span>`;
                    
                    let remainingTime = booking.expiresAt - now;
                    startAutoReleaseTimer(seat.id, remainingTime);
                }
            } catch (e) {
                localStorage.removeItem(seat.id);
            }
        }
    });
    updateLiveCounter();
};
