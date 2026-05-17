import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BusinessModule } from './business-module.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity({ name: 'businesses' })
export class Business {
  @PrimaryGeneratedColumn('uuid', { name: 'business_id' })
  businessId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.businesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user!: User;

  @Column({ type: 'varchar', name: 'business_name', length: 100 })
  businessName!: string;

  @Column({ type: 'varchar', name: 'industry', length: 100 })
  industry!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => Customer, (customer) => customer.business)
  customers!: Customer[];

  @OneToMany(() => BusinessModule, (businessModule) => businessModule.business)
  businessModules!: BusinessModule[];
}
