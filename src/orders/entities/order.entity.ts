import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../../database/database.enums';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { QuotationEntity } from '../../quotations/entities/quotation.entity';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  orderId!: string;

  @Column({ type: 'uuid', name: 'quotation_id', unique: true })
  quotationId!: string;

  @ManyToOne(() => QuotationEntity, (quotation) => quotation.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id', referencedColumnName: 'quotationId' })
  quotation!: QuotationEntity;

  @Column({
    type: 'enum',
    name: 'status',
    enum: OrderStatus,
    enumName: 'order_status_enum',
  })
  status!: OrderStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', name: 'reference_code', length: 100 })
  referenceCode!: string;

  @OneToMany(() => PaymentEntity, (payment) => payment.order)
  payments!: PaymentEntity[];
}
