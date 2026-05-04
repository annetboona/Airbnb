export declare const Role: {
    readonly ADMIN: "ADMIN";
    readonly HOST: "HOST";
    readonly GUEST: "GUEST";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const ListingType: {
    readonly APARTMENT: "APARTMENT";
    readonly HOUSE: "HOUSE";
    readonly VILLA: "VILLA";
    readonly CABIN: "CABIN";
};
export type ListingType = (typeof ListingType)[keyof typeof ListingType];
export declare const BookingStatus: {
    readonly PENDING: "PENDING";
    readonly CONFIRMED: "CONFIRMED";
    readonly CANCELLED: "CANCELLED";
};
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
//# sourceMappingURL=enums.d.ts.map