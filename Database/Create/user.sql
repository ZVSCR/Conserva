create table users (
    id serial primary key,
    username varchar(50) not null unique,
    email varchar(100) not null unique,
    tipo varchar(11) not null,
    password_hash varchar(255) not null,
    notify_push boolean not null default true,
    notify_email boolean not null default true,
    is_dark_theme boolean not null default false,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);