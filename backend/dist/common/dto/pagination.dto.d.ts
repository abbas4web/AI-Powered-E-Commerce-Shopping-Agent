export declare class PaginationDto {
    page: number;
    limit: number;
    get skip(): number;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export declare function paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T>;
