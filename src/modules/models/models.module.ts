import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelEntity } from './entities/model.entity';
import { ModelRepository } from './model.repository';
import { ModelService } from './model.service';
import { ModelController } from './model.controller';
import { AuthModule } from '../auth/auth.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [TypeOrmModule.forFeature([ModelEntity]), AuthModule, BrandsModule],
  controllers: [ModelController],
  providers: [ModelService, ModelRepository],
  exports: [ModelService],
})
export class ModelsModule {}
