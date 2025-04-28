import React from "react";
import "./LandingPage.css";
import batteryIcon from "./icons/document.png";
import batteryIcon2 from "./icons/car-blue.png";


export default function LandingPage({ onStart }) {
  return (
    <div className="landing-container">
      <h1 className="landing-title">
        <span className="aira-logo">
          AIRA<span className="aira-highlight">IA</span>
        </span>
        <br /><br />
        <div className="painel-frase">
		  Assistente Inteligente em Recurso de Auto de Infração de Trânsito
		</div>
      </h1>

      <p className="landing-subtitle">
        Descubra irregularidades em autos de infrações <br />
        com apoio técnico e jurídico em IA.
      </p>

      <div className="cards-container">
        <div className="info-card">
          <h3>
            <img src={batteryIcon} alt="icone" className="icon" /> Como funciona
          </h3>
          <ul>
            <li>✓ Envie seu auto de infração .PDF;</li>
            <li>✓ A IA analisa com base no CTB, CONTRAN, MBFT, INMETRO e outros;</li>
            <li>✓ Você recebe um parecer jurídico completo;</li>
			<li>✓ Opção para a IA criar a sua defesa prévia de forma imediata;</li>
            <li>✓ O parecer é disponibilizado para visualização e/ou impressão;</li>
          </ul>
        </div>
        <div className="info-card">
          <h3>
            <img src={batteryIcon2} alt="icone" className="icon" /> Por que usar?
          </h3>
          <ul>
            <li>✓ Detecta erros formais e materiais;</li>
            <li>✓ Garante respaldo jurídico atualizado;</li>
            <li>✓ Otimiza recursos administrativos;</li>
			<li>✓ O tempo é seu aliado; </li>
			<li>✓ Indicado para qualquer pessoa;</li>
          </ul>
        </div>
      </div>

      <button className="landing-button" onClick={onStart}>
        Enviar Auto para Análise
      </button>

      <p className="landing-footer">Atendimento seguro, rápido e confiável.</p>

      <div className="landing-copyright">
        ©2025 Cesar Rigonato. Todos os direitos reservados.
      </div>
    </div>
  );
}
