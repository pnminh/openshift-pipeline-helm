FROM postgres:16-alpine
RUN mkdir temp
RUN addgroup -S non-root-postgres-group && \
    adduser -S non-root-postgres-user -G non-root-postgres-group && \
    chown -R non-root-postgres-user:non-root-postgres-group /temp && \
    chmod 777 /temp
USER non-root-postgres
