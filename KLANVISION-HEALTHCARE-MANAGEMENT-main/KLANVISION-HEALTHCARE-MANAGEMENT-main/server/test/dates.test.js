const test = require("node:test");
const assert = require("node:assert/strict");
const { parseAppointmentDate, isPastAppointment } = require("../src/utils/dates");

test("parseAppointmentDate accepts valid calendar dates and normalizes to UTC midnight", () => {
  assert.equal(parseAppointmentDate("2030-06-15").toISOString(), "2030-06-15T00:00:00.000Z");
});

test("parseAppointmentDate rejects malformed and impossible dates", () => {
  assert.equal(parseAppointmentDate("2030-02-30"), null);
  assert.equal(parseAppointmentDate("15-06-2030"), null);
});

test("isPastAppointment rejects dates earlier than the current time", () => {
  assert.equal(isPastAppointment(new Date("2000-01-01T00:00:00.000Z"), "09:00"), true);
});
