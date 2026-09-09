create table item (
    id serial,
    compra_id integer references compra(id),
    nome_item varchar(100) not null, 
    quantidade numeric(9, 2) not null,
    unidade_de_medida varchar(20) not null,
    valor_unitario numeric(9, 2) not null,
    validade_estimada date,
    primary key(id, compra_id)
);  