import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandEntity } from '../../brands/entities/brand.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('models')
export class ModelEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'int', name: 'brand_id' })
  brandId: number;

  @ManyToOne(() => BrandEntity)
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity;

  @Column({ type: 'int', name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @CreateDateColumn({ type: 'datetime2', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime2', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
