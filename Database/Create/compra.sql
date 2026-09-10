create table compra (
    id serial primary key,
    usuario_id integer references users(id) on delete cascade not null,
    data_compra timestamp default current_timestamp,
    valor_total numeric(9, 2) not null,
    estabelecimento varchar(50)
);  