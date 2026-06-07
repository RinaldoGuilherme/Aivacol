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
import { ModelEntity } from '../../models/entities/model.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 20, name: 'license_plate' })
  licensePlate: string;

  @Column({ type: 'varchar', length: 50, name: 'chassis' })
  chassis: string;

  @Column({ type: 'varchar', length: 20, name: 'renavam' })
  renavam: string;

  @Column({ type: 'int', name: 'year' })
  year: number;

  @Column({ type: 'int', name: 'model_id' })
  modelId: number;

  @ManyToOne(() => ModelEntity)
  @JoinColumn({ name: 'model_id' })
  model: ModelEntity;

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
