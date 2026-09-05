export declare const jwtConfig: (() => {
    secret: string | undefined;
    expiresIn: string;
    refreshSecret: string | undefined;
    refreshExpiresIn: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string | undefined;
    expiresIn: string;
    refreshSecret: string | undefined;
    refreshExpiresIn: string;
}>;
