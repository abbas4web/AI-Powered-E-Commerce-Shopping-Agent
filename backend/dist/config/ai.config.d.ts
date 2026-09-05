export declare const aiConfig: (() => {
    provider: string;
    gemini: {
        apiKey: string | undefined;
        model: string;
    };
    groq: {
        apiKey: string | undefined;
        model: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    provider: string;
    gemini: {
        apiKey: string | undefined;
        model: string;
    };
    groq: {
        apiKey: string | undefined;
        model: string;
    };
}>;
