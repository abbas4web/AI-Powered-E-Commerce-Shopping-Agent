export declare enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
