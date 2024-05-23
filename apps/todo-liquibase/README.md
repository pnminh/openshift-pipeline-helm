## Run migration scripts with maven liquibase plugin
### Locally
Start up a local Postgres DB. I use podman in this example.
```sh
podman pod create --name todo-pod -p 5432:5432
podman run -d --pod todo-pod --name todo-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=todo-db -v todo_pgdata:/var/lib/postgresql/data postgres:latest
```
DB can then be updated: `mvn liquibase:update -P local`
### Other environments
Using different maven profiles, we can set up connection to other DBs. For example, to connect to a dev DB:
```bash
export DATABASE_URL="jdbc:postgresql://dev-host:5432/dev-db"
export DATABASE_USERNAME="dev_user"
export DATABASE_PASSWORD="dev_password"
mvn liquibase:update -P external
```