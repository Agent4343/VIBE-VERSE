/**
 * Sequelize Models Index
 *
 * Initializes database connection and loads all models.
 */

import { Sequelize, DataTypes } from 'sequelize';

// Database configuration
const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/cosmic_academy';

// Create Sequelize instance
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        min: parseInt(process.env.DB_POOL_MIN) || 2,
        acquire: 30000,
        idle: 10000
    },
    define: {
        underscored: true,
        freezeTableName: true
    }
});

// ========================================
// User Model
// ========================================
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 30],
            is: /^[a-zA-Z0-9_]+$/
        }
    },
    email: {
        type: DataTypes.STRING(255),
        unique: true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        field: 'password_hash'
    },
    avatarId: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'avatar_id'
    },
    isGuest: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_guest'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    parentalEmail: {
        type: DataTypes.STRING(255),
        field: 'parental_email'
    },
    parentalConsent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'parental_consent'
    },
    age: {
        type: DataTypes.INTEGER
    },
    lastLogin: {
        type: DataTypes.DATE,
        field: 'last_login'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// ========================================
// Score Model
// ========================================
const Score = sequelize.define('Score', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    levelId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'level_id'
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 999999
        }
    },
    bronzeStars: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'bronze_stars'
    },
    silverStars: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'silver_stars'
    },
    goldStars: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'gold_stars'
    },
    completionTime: {
        type: DataTypes.INTEGER,
        field: 'completion_time'
    }
}, {
    tableName: 'scores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        { fields: ['level_id'] },
        { fields: ['score'] },
        { fields: ['user_id', 'level_id'], unique: true }
    ]
});

// ========================================
// Progress Model
// ========================================
const Progress = sequelize.define('Progress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    currentChapter: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'current_chapter'
    },
    currentLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'current_level'
    },
    totalStars: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_stars'
    },
    unlockedUpgrades: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'unlocked_upgrades'
    },
    gameState: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'game_state'
    }
}, {
    tableName: 'progress',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
});

// ========================================
// Achievement Model
// ========================================
const Achievement = sequelize.define('Achievement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    achievementId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'achievement_id'
    },
    unlockedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'unlocked_at'
    }
}, {
    tableName: 'achievements',
    timestamps: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['user_id', 'achievement_id'], unique: true }
    ]
});

// ========================================
// Achievement Definition Model
// ========================================
const AchievementDefinition = sequelize.define('AchievementDefinition', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    iconId: {
        type: DataTypes.STRING(50),
        field: 'icon_id'
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isSecret: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_secret'
    }
}, {
    tableName: 'achievement_definitions',
    timestamps: false
});

// ========================================
// Associations
// ========================================

// User has many Scores
User.hasMany(Score, { foreignKey: 'userId', as: 'scores' });
Score.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User has one Progress
User.hasOne(Progress, { foreignKey: 'userId', as: 'progress' });
Progress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User has many Achievements
User.hasMany(Achievement, { foreignKey: 'userId', as: 'achievements' });
Achievement.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Achievement belongs to Definition
Achievement.belongsTo(AchievementDefinition, {
    foreignKey: 'achievementId',
    as: 'definition'
});

export {
    sequelize,
    User,
    Score,
    Progress,
    Achievement,
    AchievementDefinition
};
