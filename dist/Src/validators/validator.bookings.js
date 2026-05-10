import { z } from "zod";
/** Parses `YYYY-MM-DD` as local noon to avoid TZ edge cases; also accepts ISO datetimes */
function bookingDate(s) {
    const t = s.trim();
    const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (plain) {
        const y = Number(plain[1]);
        const m = Number(plain[2]) - 1;
        const d = Number(plain[3]);
        return new Date(y, m, d, 12, 0, 0, 0);
    }
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) {
        throw new Error("invalid");
    }
    return d;
}
export const createBookingSchema = z
    .object({
    listingId: z.string().uuid("Invalid listing ID format"),
    checkIn: z.string().min(1, "checkIn is required"),
    checkOut: z.string().min(1, "checkOut is required"),
})
    .superRefine((data, ctx) => {
    let start;
    let end;
    try {
        start = bookingDate(data.checkIn);
        end = bookingDate(data.checkOut);
    }
    catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid checkIn / checkOut format", path: ["checkIn"] });
        return;
    }
    if (start >= end) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Check-in date must be before check-out date",
            path: ["checkOut"],
        });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ci = new Date(start);
    ci.setHours(0, 0, 0, 0);
    if (ci < today) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Check-in date cannot be in the past",
            path: ["checkIn"],
        });
    }
});
//# sourceMappingURL=validator.bookings.js.map