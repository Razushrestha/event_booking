export interface DashboardMetrics {
    totalRevenue: number;
    totalTickets: number;
    pendingTickets: number;
}

export interface EventTicketStat {
    eventId: string;
    eventName: string;
    approved: number;
    pending: number;
    rejected: number;
    total: number;
}

export interface TicketInfo {
    tierName: string;
}

export interface PendingTicket {
    ticketId: string;
    name: string;
    userId: string;
    eventName: string;
    ticketInfo: TicketInfo;
}

export interface RecentRegistration {
    ticketId: string;
    eventName: string;
    name: string;
    ticketInfo: TicketInfo;
    status: 'approved' | 'pending' | 'rejected';
    submittedAt: string;
}

export interface UpcomingEvent {
    eventId: string;
    title: string;
    startDateTime: string;
    ticketTiers: Array<{ name: string }>;
}

export interface PaginationInfo {
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalCount: number;
    limit: number;
}

export interface PaginatedData<T> {
    data: T[];
    pagination: PaginationInfo;
}