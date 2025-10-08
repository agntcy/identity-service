# Database

The Agent Identity Service uses a database to persist all core entities, such as apps, issued badges, issuer settings, etc.

The following technologies are used in the persistence layer:

- [PostgreSQL](https://www.postgresql.org/) is used as the database engine.
- [GORM](https://gorm.io/) is used as an ORM library to simplify database interactions by mapping Go structs to database tables. For more information about GORM, refer to the [documentation](https://gorm.io/docs/index.html).

The use of GORM or any database technology APIs is confined to the implementation of repositories. Domain and Application services interact with the persistence layer exclusively through repository interfaces.

Each domain within [`internal/core`](https://github.com/agntcy/identity-service/tree/main/backend/internal/core) that requires persistence includes its implementation in a package named after the database engine, `postgres` in our case.

## Declaring models

Database models are defined as structs, with each model typically mapped to a single table. However, a model can be represented by multiple structs depending on the case.

Most models include an ID field of type `uuid.UUID` and a `TenantID` field of type `string`, with `TenantID` being indexed in the database. Additionally, metadata fields such as `CreatedAt`, `UpdatedAt` and `DeletedAt` are included in these models.

Database models are created using factory functions that construct an instance from a domain model. Each database model also provides a method to convert its instance back into the corresponding domain model.


## Migrations

Mapping database models to tables is managed through migrations. In Agent Identity Service, auto-migrations are enabled.

To add a new database model to the migrations, update `cmd/bff/main.go` by passing an empty instance of the model to the `dbContext.AutoMigrate()` method call.
