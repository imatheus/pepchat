import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement
} from "sequelize-typescript";

@Table
class AsaasConfig extends Model<AsaasConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  apiKey: string;

  @Column
  webhookUrl: string;

  @Column
  environment: string; // 'sandbox' ou 'production'

  @Column
  enabled: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default AsaasConfig;