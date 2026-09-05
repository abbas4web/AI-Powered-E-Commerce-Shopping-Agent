export declare const storageConfig: (() => {
    provider: string;
    cloudinary: {
        cloudName: string | undefined;
        apiKey: string | undefined;
        apiSecret: string | undefined;
    };
    s3: {
        endpoint: string | undefined;
        bucket: string;
        region: string;
        accessKey: string | undefined;
        secretKey: string | undefined;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    provider: string;
    cloudinary: {
        cloudName: string | undefined;
        apiKey: string | undefined;
        apiSecret: string | undefined;
    };
    s3: {
        endpoint: string | undefined;
        bucket: string;
        region: string;
        accessKey: string | undefined;
        secretKey: string | undefined;
    };
}>;
