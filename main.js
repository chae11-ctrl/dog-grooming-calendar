
// Global State
let currentYear = 2026;
let currentMonth = 2; // March (0-indexed)
let bookings = {}; // Store bookings using a unique ID

// View Elements
const calendarView = document.getElementById('calendar-view');
const schedulerView = document.getElementById('scheduler-view');

// Calendar Elements
const calendarTitle = document.getElementById('calendar-title');
const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Scheduler Elements
const schedulerTitle = document.getElementById('scheduler-title');
const scheduleGrid = document.getElementById('schedule-grid');
const backToCalendarBtn = document.getElementById('back-to-calendar');

// Modal Elements
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
const bookingForm = document.getElementById('booking-form');
const deleteBookingBtn = document.getElementById('delete-booking');
const modalCellIdInput = document.getElementById('modal-cell-id');
const colorPicker = document.getElementById('color-picker');

// Constants
const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
const schedulerDays = ['월', '화', '수', '목', '금', '토'];
const hours = Array.from({ length: 12 }, (_, i) => String(9 + i).padStart(2, '0') + ':00');
const pastelColors = {
    default: 'rgba(255, 255, 255, 0.7)',
    pink: 'rgba(255, 229, 236, 0.7)',
    yellow: 'rgba(255, 248, 225, 0.7)',
    green: 'rgba(229, 255, 239, 0.7)',
    blue: 'rgba(229, 242, 255, 0.7)',
    purple: 'rgba(242, 229, 255, 0.7)',
};
let selectedColor = 'default';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderCalendar(currentYear, currentMonth);
    setupEventListeners();
    setupColorPicker();
});

function setupEventListeners() {
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
    });

    backToCalendarBtn.addEventListener('click', () => {
        schedulerView.classList.add('hidden');
        calendarView.classList.remove('hidden');
    });

    // Modal listeners
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    bookingForm.addEventListener('submit', handleBookingSubmit);
    deleteBookingBtn.addEventListener('click', handleBookingDelete);
}

function setupColorPicker() {
    Object.keys(pastelColors).forEach(colorName => {
        if(colorName === 'default') return; // Don't create a picker for the default color
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-option';
        colorDiv.style.backgroundColor = pastelColors[colorName].replace('0.7', '1'); // Show solid color in picker
        colorDiv.dataset.color = colorName;

        colorDiv.addEventListener('click', () => {
            selectedColor = colorName;
            // Update selection visual
            document.querySelectorAll('#color-picker .color-option').forEach(el => el.classList.remove('selected'));
            colorDiv.classList.add('selected');
        });

        colorPicker.appendChild(colorDiv);
    });
}

// --- CALENDAR LOGIC ---
function renderCalendar(year, month) {
    calendarGrid.innerHTML = '';
    calendarTitle.textContent = `${year}년 ${month + 1}월`;
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.classList.add('calendar-day-header');
        calendarGrid.appendChild(dayHeader);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let dayCounter = 1;

    for (let i = 0; i < 42; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        if (i >= firstDay && dayCounter <= daysInMonth) {
            const date = new Date(year, month, dayCounter);
            dayCell.innerHTML = `<span class="day-number">${dayCounter}</span>`;
            dayCell.dataset.date = date.toISOString().split('T')[0];
            const weekStartDate = new Date(date);
            weekStartDate.setDate(date.getDate() - date.getDay());
            dayCell.addEventListener('click', () => renderWeeklyScheduler(weekStartDate));
            dayCounter++;
        } else {
            dayCell.classList.add('other-month');
        }
        calendarGrid.appendChild(dayCell);
    }
}

// --- SCHEDULER LOGIC ---
function renderWeeklyScheduler(weekStartDate) {
    calendarView.classList.add('hidden');
    schedulerView.classList.remove('hidden');
    const monday = new Date(weekStartDate);
    monday.setDate(monday.getDate() + 1);
    const saturday = new Date(weekStartDate);
    saturday.setDate(saturday.getDate() + 6);
    schedulerTitle.textContent = `${monday.getFullYear()}년 ${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${saturday.getDate()}일 주간 스케줄`;
    scheduleGrid.innerHTML = '';

    scheduleGrid.appendChild(document.createElement('div'));
    schedulerDays.forEach((day, index) => {
        const dayHeader = document.createElement('div');
        const headerDate = new Date(monday);
        headerDate.setDate(headerDate.getDate() + index);
        dayHeader.innerHTML = `${day}<br><span class="text-sm font-normal">${headerDate.getDate()}</span>`;
        dayHeader.classList.add('day-header');
        scheduleGrid.appendChild(dayHeader);
    });

    hours.forEach(hour => {
        const timeHeader = document.createElement('div');
        timeHeader.textContent = hour;
        timeHeader.classList.add('time-header');
        scheduleGrid.appendChild(timeHeader);
        schedulerDays.forEach((day, dayIndex) => {
            const cell = document.createElement('div');
            const cellDate = new Date(monday);
            cellDate.setDate(cellDate.getDate() + dayIndex);
            const dateString = cellDate.toISOString().split('T')[0];
            const cellId = `cell-${dateString}-${hour.split(':')[0]}`;
            cell.id = cellId;
            cell.classList.add('schedule-cell');
            cell.addEventListener('click', () => openModal(cellId));
            const booking = bookings[cellId];
            if (booking) {
                cell.innerHTML = getBookingContent(booking);
                const contentDiv = cell.querySelector('.schedule-cell-content');
                contentDiv.style.backgroundColor = pastelColors[booking.color] || pastelColors.default;
            } else {
                cell.innerHTML = '<div class="schedule-cell-content"></div>';
            }
            scheduleGrid.appendChild(cell);
        });
    });
}

function getBookingContent(booking) {
    return `
        <div class="schedule-cell-content">
            <p class="font-bold">${booking.dogName} (${booking.ownerName})</p>
            <p class="text-xs">${booking.phoneNumber}</p>
            <p class="text-xs">${booking.details}</p>
        </div>
    `;
}

// --- MODAL & BOOKING LOGIC ---
function openModal(cellId) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modalCellIdInput.value = cellId;
    const booking = bookings[cellId];
    if (booking) {
        bookingForm['dog-name'].value = booking.dogName;
        bookingForm['owner-name'].value = booking.ownerName;
        bookingForm['phone-number'].value = booking.phoneNumber;
        bookingForm['details'].value = booking.details;
        selectedColor = booking.color || 'default';
        deleteBookingBtn.classList.remove('hidden');
    } else {
        bookingForm.reset();
        selectedColor = 'default';
        deleteBookingBtn.classList.add('hidden');
    }
    // Update color picker selection
    document.querySelectorAll('#color-picker .color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === selectedColor);
    });
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    bookingForm.reset();
}

function handleBookingSubmit(e) {
    e.preventDefault();
    const cellId = modalCellIdInput.value;
    if (!cellId) return;
    const formData = new FormData(bookingForm);
    const bookingData = {
        dogName: formData.get('dog-name'),
        ownerName: formData.get('owner-name'),
        phoneNumber: formData.get('phone-number'),
        details: formData.get('details'),
        color: selectedColor,
    };
    bookings[cellId] = bookingData;
    const cell = document.getElementById(cellId);
    if (cell) {
        cell.innerHTML = getBookingContent(bookingData);
        const contentDiv = cell.querySelector('.schedule-cell-content');
        contentDiv.style.backgroundColor = pastelColors[selectedColor] || pastelColors.default;
    }
    closeModal();
}

function handleBookingDelete() {
    const cellId = modalCellIdInput.value;
    if (cellId && bookings[cellId]) {
        delete bookings[cellId];
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.innerHTML = '<div class="schedule-cell-content"></div>';
        }
    }
    closeModal();
}
