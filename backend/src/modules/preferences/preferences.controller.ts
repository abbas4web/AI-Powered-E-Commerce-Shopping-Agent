import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Preferences')
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user preferences' })
  get(@CurrentUser() user: JwtPayload) {
    return this.preferencesService.get(user.sub);
  }

  @Put()
  @ApiOperation({ summary: 'Update current user preferences' })
  upsert(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePreferencesDto) {
    return this.preferencesService.upsert(user.sub, dto);
  }
}
