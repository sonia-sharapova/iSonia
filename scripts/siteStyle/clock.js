 // Initialize clock
    function initClock() {
    // Create hour marks
    const hourMarks = document.getElementById('hourMarks');
    for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const x = 80 + 70 * Math.sin(angle);
    const y = 80 - 70 * Math.cos(angle);

    const mark = document.createElement('div');
    mark.className = 'hour-mark';
    mark.style.left = `${x - 3}px`;
    mark.style.top = `${y - 3}px`;
    hourMarks.appendChild(mark);
}

    // Start the clock
    updateClock();
    setInterval(updateClock, 1000);
}

    function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Calculate angles
    const hourAngle = (hours * 30) + (minutes * 0.5);
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;

    // Rotate hands
    document.getElementById('hourHand').style.transform = `rotate(${hourAngle}deg)`;
    document.getElementById('minuteHand').style.transform = `rotate(${minuteAngle}deg)`;
    document.getElementById('secondHand').style.transform = `rotate(${secondAngle}deg)`;

    // Update digital time
    const timeString = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    document.getElementById('digitalTime').textContent = timeString;
}

    // Initialize calendar
    let currentDate = new Date();

    function initCalendar() {
    updateCalendar();

    // Add event listeners to month controls
    document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
});

    document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
});
}

    function updateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month display
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
    document.getElementById('month-display').textContent = `${monthNames[month]} ${year}`;

    // Clear previous calendar
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Get last date of previous month
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    // Calendar grid has 6 weeks (42 days)
    const totalCells = 42;

    // Current date for highlighting today
    const today = new Date();

    let date = 1;
    let nextMonthDate = 1;

    // Create calendar cells
    for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';

    // Previous month days
    if (i < firstDay) {
    const prevDate = prevMonthLastDate - firstDay + i + 1;
    cell.textContent = prevDate;
    cell.classList.add('other-month');
}
    // Current month days
    else if (date <= lastDate) {
    cell.textContent = date;
    cell.classList.add('current-month');

    // Weekend styling
    if (i % 7 === 0 || i % 7 === 6) {
    cell.classList.add('weekend');
}

    // Highlight today
    if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
    cell.classList.add('today');
}

    date++;
}
    // Next month days
    else {
    cell.textContent = nextMonthDate;
    cell.classList.add('other-month');
    nextMonthDate++;
}

    calendarBody.appendChild(cell);
}
}

    // Initialize components when page loads
    window.onload = function() {
    initClock();
    initCalendar();
};
