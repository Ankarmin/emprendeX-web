import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { QuotationEntity } from '../../quotations/entities/quotation.entity';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn('uuid', { name: 'customer_id' })
  customerId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.customers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @Column({ type: 'varchar', name: 'first_names', length: 100 })
  firstNames!: string;

  @Column({ type: 'varchar', name: 'last_names', length: 100, nullable: true })
  lastNames!: string | null;

  @Column({ type: 'varchar', name: 'email', length: 150, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', name: 'phone', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', name: 'address', nullable: true })
  address!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => QuotationEntity, (quotation) => quotation.customer)
  quotations!: QuotationEntity[];
}
