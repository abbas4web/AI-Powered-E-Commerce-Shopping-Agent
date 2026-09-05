import { PreferencesService } from './preferences.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
export declare class PreferencesController {
    private readonly preferencesService;
    constructor(preferencesService: PreferencesService);
    get(user: JwtPayload): Promise<{
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
    upsert(user: JwtPayload, dto: UpdatePreferencesDto): Promise<{
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
