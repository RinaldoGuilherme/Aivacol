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
import { UserEntity } from '../../users/entities/user.entity';

@Entity('brands')
export class BrandEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

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
