import { useState, useRef } from "react";
import "./UploadPDF.css";
import html2pdf from "html2pdf.js";

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

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setAnaliseResposta("");
    setMessage("");

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

  const handleAnalise = async () => {
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
          prompt:
            userPrompt ||
            "Existe alguma inconsistência legal ou possibilidade de defesa com base no CTB, CONTRAN ou MBFT?",
        }),
      });

      const data = await response.json();
      setAnaliseResposta(data.resposta || "Nenhuma resposta gerada.");
    } catch (error) {
      setAnaliseResposta("Erro ao realizar análise.");
    }

    setAnaliseLoading(false);
  };

  const handleAnaliseCompletaIA = async () => {
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
          prompt:
            "Realize uma análise jurídica completa com base em todos os dados extraídos do auto de infração. Verifique eventuais inconsistências ou ilegalidades conforme a Lei 9503/97 (Código de Trânsito Brasileiro), resoluções vigentes do CONTRAN e o Manual Brasileiro de Fiscalização de Trânsito.",
        }),
      });

      const data = await response.json();
      setAnaliseResposta(data.resposta || "Nenhuma resposta gerada.");
    } catch (error) {
      setAnaliseResposta("Erro ao realizar análise completa.");
    }

    setAnaliseLoading(false);
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
    fileInputRef.current.value = "";
  };

  function formatarRespostaIA(texto) {
    if (!texto) return "";
    let html = texto.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(\d+)\.\s*(?=\*\*)/g, "</li><li>").replace(/^<\/li>/, "");
    html = html.replace(/\n{2,}/g, "</li></ol><p>").replace(/\n/g, "<br />");
    if (html.includes("<li>")) html = "<ol>" + html + "</li></ol>";
    return html;
  }

  return (
    <div className="upload-container">
      <div className="upload-box">
        <h1 className="upload-title">Notificação de Autuação</h1>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          ref={fileInputRef}
        />
        <div className="upload-actions">
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
          </button>
          <button className="clear-button" onClick={handleClear}>
            Limpar
          </button>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      {fields && Object.keys(fields).length > 0 && (
        <>
          <div className="fields-container">
            <h2>Dados Extraídos:</h2>
            {Object.entries(fields).map(([secao, valores]) => (
              <div key={secao}>
                <h3>{secao}</h3>
                {Object.entries(valores).map(([chave, valor]) => (
                  <p key={chave}>
                    <strong>
                      {chave.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                    </strong>{" "}
                    {valor}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {pdfImage && (
            <div className="pdf-image-container">
              <h2>Imagem do Auto de Infração :</h2>
              <img
                src={`data:image/png;base64,${pdfImage}`}
                alt="Página do PDF"
                className="pdf-image"
              />
            </div>
          )}

          <div className="pdf-image-container">
            <h2>Registro Fotográfico Ampliado:</h2>
            {registroFotografico === 1 ? (
              <img
                src={`data:image/png;base64,${imagemDestaque}`}
                alt="Foto da infração"
                className="pdf-image"
              />
            ) : registroFotografico === 0 ? (
              <p className="no-photo-text">SEM FOTO CADASTRADA</p>
            ) : null}
          </div>

          <div className="analise-container">
            <h3>Digite sua dúvida sobre os dados extraídos:</h3>
            <textarea
              className="prompt-textarea"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Exemplo: Essa infração pode ser contestada por ausência de assinatura do agente?"
            />

            <div className="botao-container mt-6 mb-4 p-4 bg-gray-100 rounded shadow-sm flex gap-4 justify-center">
              <button className="upload-button" onClick={handleAnalise} disabled={analiseLoading}>
                {analiseLoading ? "Analisando..." : "🧠 Análise de Recurso via Prompt"}
              </button>

              <button
                className="upload-button"
                onClick={handleAnaliseCompletaIA}
                disabled={analiseLoading}
              >
                {analiseLoading ? "Analisando..." : "🤖 Análise de Recurso IA"}
              </button>
            </div>

            {analiseResposta && (
              <div
                id="analise-pdf-export"
                className="bg-white border-l-4 border-blue-500 shadow-md rounded-lg p-6 mt-6"
              >
                <h2 className="text-blue-800 text-lg font-semibold flex items-center mb-3">
                  <span className="mr-2">📄</span>
                  Resposta da Análise Jurídica
                </h2>
                <div
                  className="text-gray-800 whitespace-pre-line leading-relaxed max-h-[400px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: formatarRespostaIA(analiseResposta) }}
                />
                <button
                  className="upload-button mt-4"
                  onClick={handleExportPDF}
                >
                  📄 Exportar PDF
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}