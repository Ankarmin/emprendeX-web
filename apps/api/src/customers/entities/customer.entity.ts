import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { trimmedStringTransformer } from '../../common/utils/dni.util';
import { QuotationEntity } from '../../quotations/entities/quotation.entity';

@Entity({ name: 'customers' })
@Unique('uq_customers_id_business', ['customerId', 'businessId'])
@Index('uq_customers_business_email', ['businessId', 'email'], {
  unique: true,
  where: 'email IS NOT NULL',
})
@Index('uq_customers_business_phone', ['businessId', 'phone'], {
  unique: true,
  where: 'phone IS NOT NULL',
})
@Index('uq_customers_business_dni', ['businessId', 'dni'], {
  unique: true,
})
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

  @Column({
    type: 'char',
    name: 'dni',
    length: 8,
    transformer: trimmedStringTransformer,
  })
  dni!: string;

  @Column({ type: 'citext', name: 'email', nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', name: 'phone', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', name: 'address', nullable: true })
  address!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => QuotationEntity, (quotation) => quotation.customer)
  quotations!: QuotationEntity[];
}
