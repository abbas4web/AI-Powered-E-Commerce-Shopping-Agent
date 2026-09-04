import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ example: 'I need a laptop under ₹80,000 for Flutter development' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ description: 'Continue an existing conversation' })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
