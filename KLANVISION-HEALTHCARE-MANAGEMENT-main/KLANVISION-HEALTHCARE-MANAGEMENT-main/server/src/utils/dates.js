function parseAppointmentDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

function isPastAppointment(date, timeSlot) {
  const [hours, minutes] = timeSlot.split(":").map(Number);
  const appointmentTime = new Date(date);
  appointmentTime.setUTCHours(hours, minutes, 0, 0);
  return appointmentTime.getTime() <= Date.now();
}

module.exports = { parseAppointmentDate, isPastAppointment };
