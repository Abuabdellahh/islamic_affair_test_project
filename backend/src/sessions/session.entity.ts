import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryColumn()
  id: string;

  @Column('uuid')
  userId: string;

  @Column('json')
  data: any;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}