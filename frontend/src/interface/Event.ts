export interface TicketTierI {
    name: string;
    price: number;
    listOfFeatures: string[];
}

export interface EventDataI {
    _id: string;
    title: string;
    description: string;
    location: string;
    public: boolean;
    startDateTime: string;
    endDateTime: string;
    registrationOpen: string;
    registrationClose: string;
    poster: string;
    entryType: string;
    eventType: string;
    promoImages: string[];
    floorPlan: string | null;
    floorPlans: string[];
    ticketTiers: TicketTierI[];
    hasStalls: boolean;
    ownEvent: boolean;
    eventId: string;
    createdAt: string;
    updatedAt: string;
    minimumPaymentPercent: number;
    scheduleStart: string;
    scheduleEnd: string;
    proposal: string;
    googleMapUrl: string;
    organizer: string;
    organizerLogo: string;
    managedBy: string;
}
