import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Check,
} from 'typeorm';
import { DeliveryMethod } from '../../database/database.enums';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderEntity } from '../../orders/entities/order.entity';
import { QuotationDetailEntity } from './quotation-detail.entity';

@Entity({ name: 'quotations' })
@Check('chk_quotation_total_non_negative', '"total" >= 0')
export class QuotationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'quotation_id' })
  quotationId!: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.quotations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'customerId' })
  customer!: Customer;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'delivery_date' })
  deliveryDate!: Date;

  @Column({
    type: 'enum',
    name: 'delivery_method',
    enum: DeliveryMethod,
    enumName: 'delivery_method_enum',
  })
  deliveryMethod!: DeliveryMethod;

  @Column({ type: 'numeric', name: 'total', precision: 10, scale: 2 })
  total!: string;

  @Column({ type: 'varchar', name: 'reference_code', length: 100 })
  referenceCode!: string;

  @OneToMany(
    () => QuotationDetailEntity,
    (quotationDetail) => quotationDetail.quotation,
  )
  quotationDetails!: QuotationDetailEntity[];

  @OneToMany(() => OrderEntity, (order) => order.quotation)
  orders!: OrderEntity[];
}
