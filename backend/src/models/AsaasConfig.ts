import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType
} from "sequelize-typescript";

@Table({
  tableName: "AsaasConfigs"
})
class AsaasConfig extends Model<AsaasConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  apiKey: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  webhookUrl: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  webhookToken: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'sandbox'
  })
  environment: string; // 'sandbox' ou 'production'

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  enabled: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default AsaasConfig;