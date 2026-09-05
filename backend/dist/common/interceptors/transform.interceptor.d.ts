import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta: {
        requestId: string;
        timestamp: string;
    };
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>>;
}
