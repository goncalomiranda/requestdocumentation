import { DataTypes, Model } from "sequelize";
import sharedSequelize from "../sharedDatabase";

/**
 * Preference model for shared database
 * Used to store OAuth tokens and other shared preferences
 * This table is accessed by multiple applications
 */
class SharedPreference extends Model {
    public id!: number;
    public key!: string;
    public value!: string | null;
    public description!: string | null;
    public updatedBy!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SharedPreference.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.TEXT("long"), // Support large encrypted tokens
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        updatedBy: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
    },
    {
        sequelize: sharedSequelize,
        tableName: "Preferences",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["key"],
            },
        ],
    }
);

export default SharedPreference;
