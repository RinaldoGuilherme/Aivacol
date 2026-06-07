import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 50, name: 'value' })
  value: string;

  @Column({ type: 'varchar', length: 100, name: 'name' })
  name: string;
}
