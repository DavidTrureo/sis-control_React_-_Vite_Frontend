import { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, Send, Bot, ChevronDown } from 'lucide-react';
import { api } from '../services/api';


interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  '¿Cuál es el estado operativo general de hoy?',
  '¿Hay incidentes críticos o alertas pendientes?',
  '¿Cuántos guardias están en servicio activo?',
  '¿Qué instalaciones presentan rondas en curso?',
];

export default function CopilotSIS() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '👋 **¡Hola! Soy SIS Copilot**, tu Asistente Táctico de Inteligencia Artificial para la supervisión y control perimetral.\n\nPuedes consultarme sobre el estado de las rondas, guardias activos, incidentes críticos en tiempo real o solicitar recomendaciones de seguridad.',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputValue).trim();
    if (!prompt || isTyping) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/api/ai/copilot', { prompt });
      const aiResponseText = res.data?.response || res.data?.text || 'No se obtuvo respuesta del modelo táctico.';

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.warn('Error conectando con /api/ai/copilot, usando modo de diagnóstico local:', err);
      // Fallback inteligente
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'ai',
          text: '⚠️ **Modo Desconectado:** No se pudo establecer conexión directa con el endpoint de IA en el servidor backend. Asegúrate de que el Backend de SIS-Control esté en ejecución en el puerto 8080 y cuente con la clave `GEMINI_API_KEY` activa.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating launcher trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={styles.floatingLauncher}
          title="Abrir SIS Copilot IA"
          aria-label="Abrir Asistente Táctico de IA"
        >
          <div style={styles.pulseRing}></div>
          <div style={styles.launcherIconWrapper}>
            <Shield size={20} color="#ffffff" />
            <Sparkles size={12} color="#fbbf24" style={styles.sparkleIcon} />
          </div>
          <span style={styles.launcherText}>SIS Copilot</span>
        </button>
      )}

      {/* Expandable chat drawer */}
      {isOpen && (
        <div style={styles.drawerContainer}>
          {/* Header */}
          <div style={styles.drawerHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.botIconBadge}>
                <Bot size={18} color="#3b82f6" />
              </div>
              <div>
                <div style={styles.drawerTitle}>SIS Copilot — Táctico</div>
                <div style={styles.drawerSubtitle}>
                  <span style={styles.onlineDot}></span> Telemetría & IA Operativa
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={styles.headerCloseBtn}
              title="Minimizar Copiloto"
              aria-label="Minimizar Copiloto"
            >
              <ChevronDown size={20} color="#94a3b8" />
            </button>
          </div>

          {/* Quick Prompts Chips */}
          <div style={styles.quickChipsWrapper}>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                disabled={isTyping}
                style={styles.chipBtn}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div style={styles.messagesContainer}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {m.sender === 'ai' && (
                  <div style={styles.messageAvatar}>
                    <Shield size={14} color="#3b82f6" />
                  </div>
                )}
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(m.sender === 'user' ? styles.userBubble : styles.aiBubble),
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {m.text}
                  </div>
                  <div style={styles.timestampText}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={styles.messageRow}>
                <div style={styles.messageAvatar}>
                  <Shield size={14} color="#3b82f6" />
                </div>
                <div style={{ ...styles.messageBubble, ...styles.aiBubble }}>
                  <div style={styles.typingIndicator}>
                    <span style={styles.dot}></span>
                    <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
                    <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>
                      Analizando telemetría...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div style={styles.inputArea}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Consulta a la IA (ej. ¿Cuántos guardias hay activos?)..."
              disabled={isTyping}
              style={styles.textInput}
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !inputValue.trim()}
              style={{
                ...styles.sendBtn,
                opacity: isTyping || !inputValue.trim() ? 0.4 : 1,
              }}
              title="Enviar consulta"
              aria-label="Enviar consulta"
            >
              <Send size={16} color="#ffffff" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  floatingLauncher: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.25)',
    borderRadius: '30px',
    padding: '10px 18px',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'all 0.2s ease',
  },
  pulseRing: {
    position: 'absolute',
    inset: '-3px',
    borderRadius: '32px',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    pointerEvents: 'none',
  },
  launcherIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  sparkleIcon: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
  },
  launcherText: {
    letterSpacing: '0.3px',
  },
  drawerContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '420px',
    height: '560px',
    backgroundColor: '#0b1329',
    borderRadius: '16px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(59, 130, 246, 0.15)',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  drawerHeader: {
    padding: '14px 16px',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  botIconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
  },
  drawerSubtitle: {
    color: '#94a3b8',
    fontSize: '11.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  onlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 6px #10b981',
  },
  headerCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipsWrapper: {
    display: 'flex',
    gap: '6px',
    padding: '10px 14px',
    overflowX: 'auto',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    flexShrink: 0,
  },
  chipBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    borderRadius: '20px',
    padding: '4px 10px',
    color: '#93c5fd',
    fontSize: '11.5px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  messagesContainer: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  messageAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  messageBubble: {
    maxWidth: '82%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    wordBreak: 'break-word',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderBottomRightRadius: '3px',
  },
  aiBubble: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: '3px',
  },
  timestampText: {
    fontSize: '10px',
    opacity: 0.6,
    textAlign: 'right',
    marginTop: '4px',
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    animation: 'pulse 1s infinite',
  },
  inputArea: {
    padding: '12px 14px',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.2s',
  },
};
