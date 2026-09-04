import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompareProductsDto {
  @ApiProperty({ type: [String], description: 'Array of 2–4 product IDs to compare' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  productIds: string[];
}
