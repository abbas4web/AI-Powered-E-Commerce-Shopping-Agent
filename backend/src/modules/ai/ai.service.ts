import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider } from './interfaces/ai-provider.interface';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { AppLogger } from '../../common/logger/logger.service';

@Injectable()
export class AiService {
  private readonly logger = new AppLogger('AiService');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly orchestrator: AiOrchestratorService,
  ) {}

  async chat(userId: string, dto: ChatRequestDto) {
    this.logger.debug(
      `Chat request — user=${userId}, provider=${this.aiProvider.getProviderName()}`,
    );
    return this.orchestrator.processMessage(userId, dto);
  }
}
