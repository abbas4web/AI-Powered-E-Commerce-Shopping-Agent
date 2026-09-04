import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.findAllByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation with full message history' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.conversationsService.findById(id, user.sub);
  }
}
