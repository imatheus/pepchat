import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  HasMany,
  Unique,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Company from "./Company";

@Table({ tableName: "Invoices" })
class Invoices extends Model<Invoices> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  detail: string;

  @Column
  status: string;

  @Column
  value: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  dueDate: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column
  asaasInvoiceId: string; // ID da fatura no Asaas

  @Column
  asaasSubscriptionId: string; // ID da assinatura no Asaas

  @Column
  paymentMethod: string; // Método de pagamento

  @Column
  paymentDate: Date; // Data do pagamento

  @Column
  billingType: string; // Tipo de cobrança (BOLETO, PIX, CREDIT_CARD, etc.)

  @Column
  invoiceUrl: string; // URL da fatura no Asaas

}

export default Invoices;
