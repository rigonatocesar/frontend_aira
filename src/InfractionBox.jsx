import React from 'react';
import 'C:/Users/Cesar/react_projeto/src/components/InfractionBox.css';

const InfractionBox = ({ dados }) => {
  if (!dados || !dados['Infração']) return null;

  const info = dados['Infração'];

  return (
    <div className="infraction-container">
      <h3 className="section-title">Identificação da Infração</h3>
      
      <div className="infraction-row">
        <div><strong>Código da Infração</strong><br />{info.codigo_infracao}</div>
        <div><strong>Desdobramento</strong><br />{info.desdobramento}</div>
        <div><strong>Valor da Multa</strong><br />{info.valor_multa}</div>
      </div>

      <div className="infraction-row">
        <div className="full-width">
          <strong>Descrição da Infração</strong><br />
          {info.descricao_infracao}
        </div>
      </div>

      <div className="infraction-row">
        <div><strong>Medição Realizada</strong><br />{info.medicao_realizada}</div>
        <div><strong>Valor Considerado</strong><br />{info.valor_considerado}</div>
        <div><strong>Limite Regulamentado</strong><br />{info.limite_regulamentado}</div>
      </div>

      <div className="infraction-row">
        <div><strong>Local da Infração</strong><br />{info.local_infracao}</div>
        <div><strong>Data</strong><br />{info.data_infracao}</div>
        <div><strong>Hora</strong><br />{info.hora_infracao}</div>
      </div>

      <div className="infraction-row">
        <div><strong>Município</strong><br />{info.nome_municipio}</div>
        <div><strong>UF</strong><br />{info.uf_infracao}</div>
        <div><strong>Código do Município</strong><br />{info.codigo_municipio}</div>
      </div>
    </div>
  );
};

export default InfractionBox;
