import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active brands' })
  findAll() {
    return this.brandsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  findById(@Param('id') id: string) {
    return this.brandsService.findById(id);
  }
}
