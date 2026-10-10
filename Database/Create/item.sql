create table item (
    id serial primary key,
    compra_id integer references compra(id) on delete cascade not null,
    nome_item varchar(100) not null, 
    quantidade numeric(9, 2) not null,
    unidade_de_medida varchar(20) not null,
    tipo_medida varchar(10) not null,
    valor_unitario numeric(9, 2) not null,
    validade_estimada date,
    ingrediente_id integer references ingrediente(id),
    constraint item_quantidade_positiva check (quantidade > 0),
    constraint item_tipo_medida_valido check (
        (tipo_medida = 'unitaria' and unidade_de_medida = 'un' and quantidade = trunc(quantidade))
        or (tipo_medida = 'variavel' and unidade_de_medida in ('kg', 'g', 'L', 'mL'))
    )
);
