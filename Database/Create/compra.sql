create table compra (
    id serial,
    usuario_id integer references user(id),
    data_compra timestamp default current_timestamp,
    valor_total numeric(9, 2) not null,
    estabelecimento varchar(50)
    primary key (id, usuario_id)
);  