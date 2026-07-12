export interface Stall {
    stallId: string;
    name: string;
    status: string;
    stallTypeName: string;
}

export interface EventData {
    eventId: string;
    title: string;
    floorPlan: string | null;
    floorPlans: string[];
    stalls: Stall[];
}
