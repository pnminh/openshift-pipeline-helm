--liquibase formatted sql

--changeset pnminh:1
CREATE TABLE todo (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL
);

--changeset pnminh:2
CREATE SEQUENCE Todo_SEQ;

--changeset pnminh:3
ALTER SEQUENCE Todo_SEQ INCREMENT BY 50;