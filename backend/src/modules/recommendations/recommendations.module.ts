import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { RankingEngineService } from './ranking-engine.service';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RankingEngineService],
  exports: [RecommendationsService, RankingEngineService],
})
export class RecommendationsModule {}
