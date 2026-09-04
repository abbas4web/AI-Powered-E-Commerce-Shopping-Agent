import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ type: [String], description: 'Preferred brand IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBrands?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Preferred category IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];

  @ApiPropertyOptional({ description: 'Minimum budget in INR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ description: 'Maximum budget in INR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ type: [String], description: 'Primary use cases (gaming, development, etc.)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  useCases?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: 'Performance preference 1–5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  performancePreference?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  batteryPreference?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  cameraPreference?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  designPreference?: number;
}
