import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, History, MessageSquare, Search, Send, UploadCloud } from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const selectedDocument = useMemo(
    () => documents.find((doc) => String(doc.id) === selectedDocumentId),
    [documents, selectedDocumentId],
  );

  async function fetchDocuments() {
    const response = await fetch(`${API_BASE}/documents`);
    if (!response.ok) throw new Error('Could not load documents');
    setDocuments(await response.json());
  }

  async function fetchHistory(documentId = selectedDocumentId) {
    const query = documentId ? `?document_id=${documentId}` : '';
    const response = await fetch(`${API_BASE}/history${query}`);
    if (!response.ok) throw new Error('Could not load chat history');
    const rows = await response.json();
    setMessages(rows.map((row) => ({ role: row.role, content: row.content, sources: [] })));
  }

  useEffect(() => {
    fetchDocuments().catch((err) => setError(err.message));
    fetchHistory('').catch(() => {});
  }, []);

  useEffect(() => {
    fetchHistory(selectedDocumentId).catch((err) => setError(err.message));
  }, [selectedDocumentId]);

  async function handleUpload(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setIsUploading(true);
    setError('');
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE}/documents`, { method: 'POST', body: formData });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.detail ?? `Upload failed for ${file.name}`);
        }
      }
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAnswering) return;

    const userMessage = { role: 'user', content: trimmed, sources: [] };
    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setIsAnswering(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          document_id: selectedDocumentId ? Number(selectedDocumentId) : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? 'Chat request failed');
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: payload.answer, sources: payload.sources ?? [] },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'I could not complete that request.', sources: [] },
      ]);
    } finally {
      setIsAnswering(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Search size={22} /></div>
          <div>
            <h1>RAG Chatbot</h1>
            <p>PDF knowledge workspace</p>
          </div>
        </div>

        <button className="upload-button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <UploadCloud size={18} />
          {isUploading ? 'Indexing PDFs' : 'Upload PDFs'}
        </button>
        <input ref={fileInputRef} type="file" accept="application/pdf" multiple onChange={handleUpload} hidden />

        <section className="panel">
          <div className="panel-title">
            <FileText size={16} />
            Documents
          </div>
          <select value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)}>
            <option value="">All documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.filename}</option>
            ))}
          </select>
          <div className="document-list">
            {documents.map((doc) => (
              <button
                key={doc.id}
                className={`document-row ${String(doc.id) === selectedDocumentId ? 'active' : ''}`}
                onClick={() => setSelectedDocumentId(String(doc.id))}
              >
                <span>{doc.filename}</span>
                <small>{doc.chunk_count} chunks</small>
              </button>
            ))}
            {!documents.length && <p className="empty">Upload PDFs to start searching.</p>}
          </div>
        </section>
      </aside>

      <section className="chat-area">
        <header className="topbar">
          <div>
            <span className="eyebrow"><History size={14} /> Chat history</span>
            <h2>{selectedDocument ? selectedDocument.filename : 'Ask across every uploaded document'}</h2>
          </div>
          <div className="status-pill">{documents.length} documents</div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <div className="messages">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <div className="message-icon"><MessageSquare size={16} /></div>
              <div className="message-body">
                <p>{message.content}</p>
                {!!message.sources?.length && (
                  <div className="sources">
                    {message.sources.map((source, sourceIndex) => (
                      <details key={`${source.filename}-${source.page}-${sourceIndex}`}>
                        <summary>{source.filename} {source.page ? `page ${source.page}` : ''}</summary>
                        <p>{source.snippet}</p>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
          {!messages.length && (
            <div className="welcome">
              <h3>Upload PDFs, then ask grounded questions.</h3>
              <p>Answers are generated from retrieved passages and include page-level citations.</p>
            </div>
          )}
        </div>

        <form className="composer" onSubmit={handleAsk}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about your documents..."
            rows={2}
          />
          <button type="submit" disabled={!question.trim() || isAnswering}>
            <Send size={18} />
            {isAnswering ? 'Thinking' : 'Ask'}
          </button>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
