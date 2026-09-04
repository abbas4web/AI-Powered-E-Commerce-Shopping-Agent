import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComparisonsService } from './comparisons.service';
import { CompareProductsDto } from './dto/compare-products.dto';

@ApiTags('Comparisons')
@Controller('products/compare')
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  @Post()
  @ApiOperation({ summary: 'Compare 2–4 products side by side' })
  compare(@Body() dto: CompareProductsDto) {
    return this.comparisonsService.compare(dto.productIds);
  }
}
