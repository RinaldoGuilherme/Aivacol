import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1717200000000 implements MigrationInterface {
  name = 'InitialSchema1717200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE roles (
        id INT IDENTITY(1,1) NOT NULL,
        value VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        CONSTRAINT PK_roles_id PRIMARY KEY (id)
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX UX_roles_value ON roles (value)`);

    await queryRunner.query(`
      CREATE TABLE users (
        id INT IDENTITY(1,1) NOT NULL,
        role_id INT NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_users_id PRIMARY KEY (id),
        CONSTRAINT FK_users_role_id FOREIGN KEY (role_id) REFERENCES roles (id)
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX UX_users_email ON users (email)`);
    await queryRunner.query(`CREATE INDEX IX_users_role_id ON users (role_id)`);

    await queryRunner.query(`
      CREATE TABLE brands (
        id INT IDENTITY(1,1) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_by INT NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_brands_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_brands_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_brands_id PRIMARY KEY (id),
        CONSTRAINT FK_brands_created_by FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX UX_brands_name ON brands (name)`);
    await queryRunner.query(`CREATE INDEX IX_brands_created_by ON brands (created_by)`);

    await queryRunner.query(`
      CREATE TABLE models (
        id INT IDENTITY(1,1) NOT NULL,
        name VARCHAR(255) NOT NULL,
        brand_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_models_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_models_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_models_id PRIMARY KEY (id),
        CONSTRAINT FK_models_brand_id FOREIGN KEY (brand_id) REFERENCES brands (id),
        CONSTRAINT FK_models_created_by FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);
    await queryRunner.query(`CREATE INDEX IX_models_brand_id ON models (brand_id)`);
    await queryRunner.query(`CREATE INDEX IX_models_created_by ON models (created_by)`);

    await queryRunner.query(`
      CREATE TABLE vehicles (
        id INT IDENTITY(1,1) NOT NULL,
        license_plate VARCHAR(20) NOT NULL,
        chassis VARCHAR(50) NOT NULL,
        renavam VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        model_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_vehicles_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_vehicles_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_vehicles_id PRIMARY KEY (id),
        CONSTRAINT FK_vehicles_model_id FOREIGN KEY (model_id) REFERENCES models (id),
        CONSTRAINT FK_vehicles_created_by FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX UX_vehicles_license_plate ON vehicles (license_plate)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX UX_vehicles_chassis ON vehicles (chassis)`);
    await queryRunner.query(`CREATE UNIQUE INDEX UX_vehicles_renavam ON vehicles (renavam)`);
    await queryRunner.query(`CREATE INDEX IX_vehicles_model_id ON vehicles (model_id)`);
    await queryRunner.query(`CREATE INDEX IX_vehicles_created_by ON vehicles (created_by)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE vehicles`);
    await queryRunner.query(`DROP TABLE models`);
    await queryRunner.query(`DROP TABLE brands`);
    await queryRunner.query(`DROP TABLE users`);
    await queryRunner.query(`DROP TABLE roles`);
  }
}
