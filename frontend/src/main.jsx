import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Download, ExternalLink, FileText, History, MessageSquare, Plus, RotateCcw, Search, Send, Trash2, UploadCloud } from 'lucide-react';
import './styles.css';

const API_BASE = (
  import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api')
).replace(/\/$/, '');

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function App() {
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [mode, setMode] = useState('documents');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const selectedDocument = useMemo(
    () => documents.find((doc) => String(doc.id) === selectedDocumentId),
    [documents, selectedDocumentId],
  );
  const selectedConversation = conversations.find((chat) => chat.id === selectedConversationId);
  const pendingDocuments = documents.some((doc) => ['pending', 'processing'].includes(doc.status));

  async function refreshDocuments() {
    setDocuments(await api('/documents'));
  }

  async function refreshConversations() {
    const rows = await api('/conversations');
    setConversations(rows);
    return rows;
  }

  async function checkHealth() {
    const health = await api('/health');
    if (!health.ai_ready) setError(health.configuration_error);
  }

  useEffect(() => {
    checkHealth().catch((err) => setError(err.message));
    refreshDocuments().catch((err) => setError(err.message));
    refreshConversations().then((rows) => {
      if (rows.length) {
        setSelectedConversationId(rows[0].id);
        setMode(rows[0].mode);
        setSelectedDocumentId(rows[0].document_id ? String(rows[0].document_id) : '');
      }
    }).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!pendingDocuments) return undefined;
    const timer = setInterval(() => refreshDocuments().catch((err) => setError(err.message)), 2000);
    return () => clearInterval(timer);
  }, [pendingDocuments]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return undefined;
    }
    let active = true;
    api(`/history?conversation_id=${selectedConversationId}`)
      .then((rows) => { if (active) setMessages(rows); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [selectedConversationId]);

  function startNewChat(nextMode = mode, documentId = selectedDocumentId) {
    setSelectedConversationId(null);
    setMode(nextMode);
    setSelectedDocumentId(nextMode === 'general' ? '' : documentId);
    setMessages([]);
    setQuestion('');
    setError('');
  }

  function selectConversation(chat) {
    setSelectedConversationId(chat.id);
    setMode(chat.mode);
    setSelectedDocumentId(chat.document_id ? String(chat.document_id) : '');
    setError('');
  }

  async function handleUpload(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setIsUploading(true);
    setError('');
    try {
      for (const [index, file] of files.entries()) {
        setUploadStatus(`Uploading ${index + 1}/${files.length}: ${file.name}`);
        const formData = new FormData();
        formData.append('file', file);
        await api('/documents', { method: 'POST', body: formData });
        await refreshDocuments();
      }
      setUploadStatus('Indexing in background');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function handleRetry(doc) {
    setBusyDocumentId(doc.id);
    setError('');
    try {
      await api(`/documents/${doc.id}/retry`, { method: 'POST' });
      await refreshDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAnswering) return;
    setMessages((current) => [...current, { role: 'user', content: trimmed, sources: [] }]);
    setQuestion('');
    setIsAnswering(true);
    setError('');
    try {
      const payload = await api('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          mode,
          document_id: mode === 'documents' && selectedDocumentId ? Number(selectedDocumentId) : null,
          conversation_id: selectedConversationId,
        }),
      });
      setMessages((current) => [...current, { role: 'assistant', content: payload.answer, sources: payload.sources }]);
      await refreshConversations();
      if (!selectedConversationId) setSelectedConversationId(payload.conversation_id);
    } catch (err) {
      setError(err.message);
      setMessages((current) => current.slice(0, -1));
      setQuestion(trimmed);
    } finally {
      setIsAnswering(false);
    }
  }

  async function handleDeleteDocument(doc) {
    if (!window.confirm(`Delete ${doc.filename} and its document-specific chats?`)) return;
    setBusyDocumentId(doc.id);
    setError('');
    try {
      await api(`/documents/${doc.id}`, { method: 'DELETE' });
      if (selectedDocumentId === String(doc.id)) startNewChat('documents', '');
      await refreshDocuments();
      await refreshConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function handleDeleteConversation(chat) {
    if (!window.confirm(`Delete chat "${chat.title}"?`)) return;
    try {
      await api(`/conversations/${chat.id}`, { method: 'DELETE' });
      if (selectedConversationId === chat.id) startNewChat(chat.mode, chat.document_id ? String(chat.document_id) : '');
      await refreshConversations();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearHistory() {
    if (!selectedConversationId || !messages.length || !window.confirm('Clear this chat?')) return;
    try {
      await api(`/history?conversation_id=${selectedConversationId}`, { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleExportHistory() {
    if (!messages.length) return;
    const transcript = messages.map((message) => {
      const citations = (message.sources ?? []).map((source) => `  Source: ${source.filename}${source.page ? ` page ${source.page}` : ''} - ${source.snippet}`).join('\n');
      return `${message.role === 'user' ? 'You' : 'Assistant'}: ${message.content}${citations ? `\n${citations}` : ''}`;
    }).join('\n\n');
    const url = URL.createObjectURL(new Blob([transcript], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${selectedConversationId ?? 'new'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Search size={22} /></div>
          <div><h1>RAG Chatbot</h1><p>Knowledge workspace</p></div>
        </div>

        <button className="new-chat-button" type="button" onClick={() => startNewChat()}><Plus size={18} /> New chat</button>
        <div className="mode-switch" role="group" aria-label="Chat mode">
          <button type="button" className={mode === 'documents' ? 'active' : ''} onClick={() => startNewChat('documents')}>Documents</button>
          <button type="button" className={mode === 'general' ? 'active' : ''} onClick={() => startNewChat('general')}>General chat</button>
        </div>

        <section className="panel">
          <div className="panel-title"><FileText size={16} /> Documents</div>
          <button className="upload-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <UploadCloud size={18} /> {isUploading ? 'Uploading' : 'Upload files'}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" multiple onChange={handleUpload} hidden />
          {(isUploading || pendingDocuments) && <p className="activity">{isUploading ? uploadStatus : 'Indexing documents...'}</p>}
          <select
            aria-label="Document scope"
            disabled={mode === 'general'}
            value={selectedDocumentId}
            onChange={(event) => startNewChat('documents', event.target.value)}
          >
            <option value="">All documents</option>
            {documents.filter((doc) => doc.status === 'ready').map((doc) => <option key={doc.id} value={doc.id}>{doc.filename}</option>)}
          </select>
          <div className="document-list">
            {documents.map((doc) => (
              <div key={doc.id} className={`document-row ${String(doc.id) === selectedDocumentId ? 'active' : ''}`}>
                <button className="document-select" type="button" disabled={doc.status !== 'ready'} onClick={() => startNewChat('documents', String(doc.id))}>
                  <span>{doc.filename}</span>
                  <small className={doc.status === 'failed' ? 'failure' : ''} title={doc.error ?? ''}>
                    {doc.status === 'ready' ? `${doc.chunk_count} chunks` : doc.status === 'failed' ? doc.error : doc.status}
                  </small>
                </button>
                {doc.status === 'failed' && <button className="icon-button document-action" type="button" title="Retry indexing" aria-label={`Retry ${doc.filename}`} disabled={busyDocumentId === doc.id} onClick={() => handleRetry(doc)}><RotateCcw size={16} /></button>}
                <button className="icon-button document-action" type="button" aria-label={`Delete ${doc.filename}`} title={`Delete ${doc.filename}`} disabled={busyDocumentId === doc.id || ['pending', 'processing'].includes(doc.status)} onClick={() => handleDeleteDocument(doc)}><Trash2 size={16} /></button>
              </div>
            ))}
            {!documents.length && <p className="empty">No documents yet.</p>}
          </div>
        </section>

        <section className="panel conversations-panel">
          <div className="panel-title"><History size={16} /> Conversations</div>
          <div className="conversation-list">
            {conversations.map((chat) => (
              <div className={`conversation-row ${chat.id === selectedConversationId ? 'active' : ''}`} key={chat.id}>
                <button className="conversation-select" type="button" onClick={() => selectConversation(chat)}>
                  <span>{chat.title}</span><small>{chat.mode === 'general' ? 'General' : 'Documents'}</small>
                </button>
                <button className="icon-button conversation-delete" type="button" title="Delete chat" aria-label={`Delete chat ${chat.title}`} onClick={() => handleDeleteConversation(chat)}><Trash2 size={15} /></button>
              </div>
            ))}
            {!conversations.length && <p className="empty">No chats yet.</p>}
          </div>
        </section>
      </aside>

      <section className="chat-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">{mode === 'general' ? 'General chat' : selectedDocument ? 'Selected document' : 'All documents'}</span>
            <h2>{selectedConversation?.title ?? (mode === 'general' ? 'Ask anything' : selectedDocument?.filename ?? 'Ask your documents')}</h2>
          </div>
          <div className="header-actions">
            <button className="icon-button" type="button" title="Download chat" aria-label="Download chat" disabled={!messages.length} onClick={handleExportHistory}><Download size={18} /></button>
            <button className="icon-button" type="button" title="Clear chat" aria-label="Clear chat" disabled={!messages.length} onClick={handleClearHistory}><Trash2 size={18} /></button>
            <div className="status-pill">{documents.filter((doc) => doc.status === 'ready').length} ready</div>
          </div>
        </header>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <div className="messages">
          {messages.map((message, index) => (
            <article key={message.id ?? `${message.role}-${index}`} className={`message ${message.role}`}>
              <div className="message-icon"><MessageSquare size={16} /></div>
              <div className="message-body">
                <p>{message.content}</p>
                {!!message.sources?.length && (
                  <div className="sources">
                    {message.sources.map((source, sourceIndex) => (
                      <details key={`${source.document_id}-${source.page}-${sourceIndex}`}>
                        <summary>{source.filename}{source.page ? ` page ${source.page}` : ''}</summary>
                        <p>{source.snippet}</p>
                        <a href={`${API_BASE}/documents/${source.document_id}/file${source.page ? `#page=${source.page}` : ''}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open source</a>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
          {!messages.length && (
            <div className="welcome">
              <h3>{mode === 'general' ? 'What would you like to know?' : 'Ask a question about your documents'}</h3>
              <p>{mode === 'general' ? 'Answers here use AI general knowledge, not your uploaded files.' : 'Document answers include source citations when passages are found.'}</p>
            </div>
          )}
        </div>
        <form className="composer" onSubmit={handleAsk}>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={mode === 'general' ? 'Ask anything...' : 'Ask about your documents...'} rows={2} />
          <button type="submit" disabled={!question.trim() || isAnswering}><Send size={18} />{isAnswering ? 'Thinking' : 'Ask'}</button>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
