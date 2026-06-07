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
import { RoleEntity } from '../../roles/entities/role.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'int', name: 'role_id' })
  roleId: number;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @Column({ type: 'varchar', length: 100, name: 'nickname' })
  nickname: string;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 255, name: 'email' })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password' })
  password: string;

  @CreateDateColumn({ type: 'datetime2', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime2', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
