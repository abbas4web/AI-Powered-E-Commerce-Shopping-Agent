import { PrismaService } from '../../database/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
export declare class PreferencesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    get(userId: string): Promise<{
        id: string;
        updatedAt: Date;
        preferredBrands: string[];
        preferredCategories: string[];
        budgetMin: number | null;
        budgetMax: number | null;
        useCases: string[];
        performancePreference: number | null;
        batteryPreference: number | null;
        cameraPreference: number | null;
        designPreference: number | null;
        userId: string;
    } | null>;
    upsert(userId: string, dto: UpdatePreferencesDto): Promise<{
        id: string;
        updatedAt: Date;
        preferredBrands: string[];
        preferredCategories: string[];
        budgetMin: number | null;
        budgetMax: number | null;
        useCases: string[];
        performancePreference: number | null;
        batteryPreference: number | null;
        cameraPreference: number | null;
        designPreference: number | null;
        userId: string;
    }>;
}
