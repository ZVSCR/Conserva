create table compra (
    id serial primary key,
    usuario_id integer references user(id),
    data_compra timestamp default current_timestamp,
    valor_total numeric(9, 2),
    estabelecimento varchar(50)
);  