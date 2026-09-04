import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get reviews for a product' })
  findByProduct(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.findByProduct(productId, limit ? parseInt(limit, 10) : 20);
  }
}
