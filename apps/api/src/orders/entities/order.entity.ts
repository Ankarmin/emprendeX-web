import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../../database/database.enums';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { QuotationEntity } from '../../quotations/entities/quotation.entity';

@Entity({ name: 'orders' })
@Unique('uq_orders_quotation', ['quotationId'])
@Unique('uq_orders_business_reference_code', ['businessId', 'referenceCode'])
@Unique('uq_orders_id_business', ['orderId', 'businessId'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  orderId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @Column({ type: 'uuid', name: 'quotation_id' })
  quotationId!: string;

  @OneToOne(() => QuotationEntity, (quotation) => quotation.order)
  @JoinColumn([
    { name: 'quotation_id', referencedColumnName: 'quotationId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  quotation!: QuotationEntity;

  @Column({
    type: 'enum',
    name: 'status',
    enum: OrderStatus,
    enumName: 'order_status_enum',
    default: OrderStatus.Pending,
  })
  status!: OrderStatus;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes!: string | null;

  @Column({
    type: 'varchar',
    name: 'reference_code',
    length: 100,
    insert: false,
    update: false,
  })
  referenceCode!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => PaymentEntity, (payment) => payment.order)
  payment!: PaymentEntity | null;
}
