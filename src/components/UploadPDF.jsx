import { useState, useRef } from "react";
import "./UploadPDF.css";
import html2pdf from "html2pdf.js";
import ReactMarkdown from 'react-markdown';
import tituloRepublica from 'C:/Users/Cesar/react_projeto/src/components/imagens/titulo_republica_brasil.png';

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfImage, setPdfImage] = useState("");
  const [imagemDestaque, setImagemDestaque] = useState("");
  const [registroFotografico, setRegistroFotografico] = useState(null);
  const [analiseResposta, setAnaliseResposta] = useState("");
  const [analiseLoading, setAnaliseLoading] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [mostrarFichaMBFT, setMostrarFichaMBFT] = useState(false);
  const [artigosUtilizados, setArtigosUtilizados] = useState([]);
  const [showModeloPDF, setShowModeloPDF] = useState(false); 
  const [codigoEnquadramento, setCodigoEnquadramento] = useState("");
  const [zoomImage, setZoomImage] = useState(null);


  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setAnaliseResposta("");
    setMessage("");
    setMostrarFichaMBFT(false);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setFields(data.dados || {});
        setPdfImage(data.img_base64 || "");
        setImagemDestaque(data.imagem_destaque || "");
        setRegistroFotografico(data.registro_fotografico);
        setMessage(data.message || "Arquivo processado.");
      } else {
        setMessage(data.message || "Erro ao processar o arquivo.");
        setFields({});
      }
    } catch (error) {
      setMessage("Erro no upload.");
    }

    setLoading(false);
  };

  const dadosValidosExtraidos = Object.values(fields).some(secao =>
    Object.values(secao).some(valor => valor && valor !== "")
  );

  const handleAnalise = async () => {
    if (!dadosValidosExtraidos) {
      alert("⚠️ É necessário fazer a importação de um arquivo válido!");
      return;
    }
    setAnaliseResposta("");
    setAnaliseLoading(true);

    try {
      const response = await fetch("http://localhost:5000/analise-juridica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dados: fields,
          prompt: userPrompt,
          modo_analise_completa: false
        }),
      });

      const data = await response.json();
      setAnaliseResposta(data.resposta || "Nenhuma resposta gerada.");
      if (data.resposta) {
        salvarComoArquivo(data.resposta, `analise_aira_${fields?.["Infração"]?.codigo_infracao || "ait"}.txt`);
      }

      setMostrarFichaMBFT(true);
    } catch (error) {
      setAnaliseResposta("Erro ao realizar análise.");
    }

    setAnaliseLoading(false);
  };

  const handleAnaliseCompletaIA = async () => {
    if (!dadosValidosExtraidos) {
      alert("⚠️ É necessário fazer a importação de um arquivo válido!");
      return;
    }
    setAnaliseResposta("");
    setAnaliseLoading(true);

    try {
      const response = await fetch("http://localhost:5000/analise-juridica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dados: fields,
          prompt: "",
          modo_analise_completa: true
        }),
      });

      const data = await response.json();
      setAnaliseResposta(data.resposta || "Nenhuma resposta gerada.");
      if (data.resposta) {
        salvarComoArquivo(data.resposta, `analise_aira_${fields?.["Infração"]?.codigo_infracao || "ait"}.txt`);
      }
      if (data.codigo_enquadramento) {
        setCodigoEnquadramento(data.codigo_enquadramento);
      }
      setMostrarFichaMBFT(true);
    } catch (error) {
      setAnaliseResposta("Erro ao realizar análise completa.");
    }

    setAnaliseLoading(false);
  };

  
  const [ssid, setSsid] = useState(null);

  const iniciarPagamento = async () => {
    const resposta = await fetch("http://localhost:5000/criar-pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssid }),
    });
    const dados = await resposta.json();
    setSsid(dados.ssid);
    window.open(dados.url_pagamento, "_blank");

    const interval = setInterval(async () => {
      const res = await fetch("http://localhost:5000/verifica-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid: dados.ssid }),
      });
      const result = await res.json();
      if (result.pago) {
        clearInterval(interval);
        alert("✅ Pagamento confirmado! Iniciando análise...");
        handleAnaliseCompletaIA();
      }
    }, 4000);
  };


  const handleExportPDF = () => {
    const element = document.getElementById("analise-pdf-export");
    const opt = {
      margin: 0.5,
      filename: "parecer-juridico.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleClear = () => {
    setFile(null);
    setMessage("");
    setFields({});
    setPdfImage("");
    setImagemDestaque("");
    setRegistroFotografico(null);
    setAnaliseResposta("");
    setUserPrompt("");
    setMostrarFichaMBFT(false);
    setCodigoEnquadramento("");
    fileInputRef.current.value = "";
  };

  

  function gerarCabecalhoABNT(campos) {
	  try {
		const atuacao = campos?.["Identificação da Atuação"] || {};
		const infracao = campos?.["Infração"] || {};

		const codigo = infracao["Código da Infração"] || "";
		const desdobramento = infracao["Desdobramento"] || "";
		let codigoFormatado = "";

		if (codigo.length >= 5) {
		  codigoFormatado = `${codigo.slice(0, 3)}-${codigo.slice(3)}`;
		} else if (codigo.length === 4 && desdobramento.length === 1) {
		  codigoFormatado = `${codigo.slice(0, 3)}-${codigo.slice(3)}${desdobramento}`;
		}

		return `
   		  <p style="margin: 0.1rem 0;"><strong>Órgão Autuador:</strong> <span style="font-family: Arial, sans-serif;">${atuacao["Órgão Autuador"] || "Não informado"}</span></p>
		  <p style="margin: 0.1rem 0;"><strong>Nº Auto de Infração:</strong> <span style="font-family: Arial, sans-serif;">${atuacao["Número do Auto de Infração (AIT)"] || "Não informado"}</span></p>
		  <p style="margin: 0.1rem 0;"><strong>Data da Notificação de Autuação:</strong> <span style="font-family: Arial, sans-serif;">${atuacao["Data de Notificação"] || "Não informado"}</span></p>
		  <p style="margin: 0.1rem 0;"><strong>Data da Infração de Trânsito:</strong> <span style="font-family: Arial, sans-serif;">${atuacao["Data da Infração"] || "Não informado"}</span></p>
		  <p style="margin: 0.1rem 0;"><strong>Data Limite Defesa Prévia:</strong> <span style="font-family: Arial, sans-serif;">${atuacao["Data Limite Defesa Prévia"] || "Não informado"}</span></p>
		  <p style="margin: 0.1rem 0;"><strong>Código do Enquadramento:</strong> <span style="font-family: Arial, sans-serif;">${codigoFormatado || "Não informado"}</span></p>
		  <p></p>
		  <p></p>
		  <p></p>
		  <p></p>
		
		 
		`
	  } catch {
		return "";
	  }
	}

	function salvarComoArquivo(texto, nomeArquivo = "analise_aira.txt") {
	  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
	  const link = document.createElement("a");
	  link.href = URL.createObjectURL(blob);
	  link.download = nomeArquivo;
	  document.body.appendChild(link);
	  link.click();
	  document.body.removeChild(link);
	}


  function formatarRespostaIA(texto) {
	  if (!texto) return "";
	  let html = texto
		.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // negrito via markdown
		.replace(/^[\s•*-]+/gm, "")
		.split(/\n{2,}/g)
		.map(paragrafo => `<p style="text-indent: 0.3em; margin-bottom: 1rem; line-height: 1.6; font-family: Arial, serif;">${paragrafo.trim()}</p>`)
		.join("");

	  html += `
		<br /><br />
		<p style="text-align: center; margin-top: 3rem;">
		  ______________________________________<br />
		  <strong>Assistente AIRA IA</strong><br />
		  Sistema de Apoio a Recursos de Infrações de Trânsito
		</p>
	  `;
	  return html;
	}
	
	
	const iniciarCheckoutPro = async () => {
	  const resposta = await fetch("http://localhost:5000/criar-checkout-pro", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ssid }),
	  });
	  const dados = await resposta.json();
	  if (dados.url_pagamento) {
		window.open(dados.url_pagamento, "_blank");
	  } else {
		alert("Erro ao gerar pagamento: " + (dados.erro || "Desconhecido"));
	  }
	};
	

  return (
    <div className="upload-container">
		  
      <div className="upload-box">
	     <span className="aira-logo">
            AIRA<span className="aira-highlight">IA</span>
			
          </span>
		  <div className="painel-azul-destaque">
		     
			  <p>• Escolha um arquivo (.pdf) e pressione o botão Enviar </p><br></br>
			  <p>• Certifique-se de selecionar  um arquivo de notificação de autuação oficial (.pdf) contendo dados legíveis e isso garantirá uma análise correta das informações.</p><br></br>
			  <p>• Na dúvida, o layout padrão pode ser visualizado no canto superior direito pressionando-se o ícone i.</p><br></br>
			  <p>• Baixe a sua notificação de infração oficial (.pdf) em:{" "} <a href="https://www.gov.br/pt-br/servicos/consultar-online-suas-infracoes-de-transito"  target="_blank"  rel="noopener noreferrer" style={{ color: "#1d4ed8", textDecoration: "underline" }}  > gov.br/consultar-infracoes </a></p>
          </div>

		  <input
			type="file"
			accept="application/pdf"
			onChange={(e) => setFile(e.target.files[0])}
			ref={fileInputRef}
		  />
		  <div className="upload-actions">
			<button className="clear-button" onClick={handleUpload} disabled={loading}>
			  {loading ? "Enviando..." : "Processar"}
			</button>
			<button className="clear-button" onClick={handleClear}>
			  Limpar
			</button>
		  </div>

		  {/* Botão informativo fixado no canto inferior direito da caixa branca */}
		  <div
			className="info-icon-fixado"
			title="Dê um Click aqui e visualize a imagem do modelo PADRÃO da notificação de autuação (multa)que deve ser utilizado para upload no sistema."
			onClick={() => setShowModeloPDF(true)}
		  >
			ℹ️
		  </div>
		</div>

      {message && ( <div className="popup-mensagem"> ✅ {message} </div> )}

      {Object.keys(fields).length > 0 && (
        <div className="fields-container">
         <div className="painel-azul-destaque">
		  <h3>Dados Extraídos do arquivo (.pdf)</h3>
			</div>
		  
			  {[
			  "Infração",
			  "Identificação da Atuação",
			  "Veículo",
			  "Condutor (Quando identificado)",
			  "Equipamento Utilizado Pelo Agente",
			  "Outros"
			].map((secao) =>
			  fields[secao] ? (
				<div key={secao} className="painel-azul-destaque">
				  <h3>📁 {secao}</h3>
				  {Object.entries(fields[secao]).map(([chave, valor]) => (
					<p key={chave} className="inline-field">
					  <span className="campo-label">{chave}:</span>{" "}
					  <span className="campo-valor">{valor}</span>
					</p>
				  ))}
				</div>
			  ) : null
			)}
	  
        </div>
      )}
	  
	  {(pdfImage || imagemDestaque) && (
		  <div className="imagens-container">
			{pdfImage && (
			  <div className="imagem-caixa">
				<h3 className="titulo-imagem">📑 Auto de Infração (PDF)</h3>
				<img 
				  src={`data:image/png;base64,${pdfImage}`} 
				  alt="Auto de Infração"
				  className={zoomImage === "pdf" ? "imagem-zoom" : ""}
				  onClick={() => setZoomImage(zoomImage === "pdf" ? null : "pdf")}
				/>
			  </div>
			)}
			{imagemDestaque && (
			  <div className="imagem-caixa">
				<h3 className="titulo-imagem">📸 Registro Fotográfico</h3>
				<img 
				  src={`data:image/png;base64,${imagemDestaque}`} 
				  alt="Registro Fotográfico"
				  className={zoomImage === "foto" ? "imagem-zoom" : ""}
				  onClick={() => setZoomImage(zoomImage === "foto" ? null : "foto")}
				/>
			  </div>
			)}
		  </div>
	    )}



      {dadosValidosExtraidos && (
        <>
          <div className="analise-container">
            <h3>Digite sua dúvida sobre os dados extraídos:</h3>
            <textarea
              className="prompt-textarea"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Exemplo: Essa infração pode ser contestada por ausência de assinatura do agente?"
            />
          </div>

          <div className="analyze-button-group">
			  <button className="analyze-button" onClick={handleAnalise} disabled={analiseLoading}>
				🧠 {analiseLoading ? "Analisando..." : "Análise de Recurso via Prompt"}
			  </button>
			  <button className="analyze-button" onClick={handleAnaliseCompletaIA} disabled={analiseLoading}>
				🤖 {analiseLoading ? "Analisando..." : "Análise de Recurso IA"}
			  </button>
			  <button className="analyze-button" onClick={iniciarPagamento} disabled={analiseLoading}>
				💳 {analiseLoading ? "Aguardando..." : "Pagar e Analisar com IA"}
			  </button>
			  <button className="analyze-button" onClick={iniciarCheckoutPro}>
				  💸 Pagar com PIX ou Cartão (Checkout Pro)
   			  </button>
   		  </div>

        </>
      )}

      {analiseResposta && (
        <div id="analise-pdf-export" className="parecer-abnt">
          <img 
			src={require('./imagens/titulo_republica_brasil.png')} 
			alt="Título República Federativa do Brasil"
			style={{
			  width: '100%',
			  maxWidth: '100%',
			  display: 'block',
			  margin: '0 auto',
			  marginBottom: '1rem',
			  borderRadius: '12px'
			}} 
		  />  
	      <div className="parecer-ia"> <div dangerouslySetInnerHTML={{__html: gerarCabecalhoABNT(fields)}} />  <ReactMarkdown>{analiseResposta}</ReactMarkdown> </div>
			  {mostrarFichaMBFT && codigoEnquadramento && (
				  <div className="ficha-mbft-container">
					<h2 className="inline-section-title">📄 Ficha Correspondente - MBFT</h2>
					<div className="ficha-mbft-pdf-wrapper" style={{
					  width: "100%",
					  margin: "0",
					  padding: "0",
					  boxSizing: "border-box"
					}}>
					  <embed
						src={`http://localhost:5000/ficha-pdf/${codigoEnquadramento}`}
						type="application/pdf"
						width="100%"
						height="600px"
						style={{
						  margin: "0",
						  padding: "0",
						  display: "block",
						  borderRadius: "0",
						  border: "none"
						}}
					  />
					</div>
				  </div>
				)}

		  
		  <div style={{ textAlign: "center", marginTop: "2rem" }}>
			  <button className="upload-button" onClick={handleExportPDF} style={{ marginTop: "2rem" }}>
				📄 Exportar em PDF
			  </button>
		  </div>
        </div>
      )}

     {showModeloPDF && (
	  <div className="modal-overlay" onClick={() => setShowModeloPDF(false)}>
		<div className="modal-content" onClick={(e) => e.stopPropagation()}>
		  <h3>Modelo Padrão do Auto de Infração</h3>
		  <embed
			src="http://localhost:5000/modelo-padrao-ait"
			type="application/pdf"
			width="100%"
			height="500px"
		  />
		  <button className="upload-button" onClick={() => setShowModeloPDF(false)}>Fechar</button>
		</div>
	  </div>
	)}
	
		  
    </div>
	
  );
}
