export class PaginatedResponseDto<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
