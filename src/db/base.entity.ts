import {CreateDateColumn, UpdateDateColumn} from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', select: false})
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    select: false,
  })
  updatedAt: Date;
}
