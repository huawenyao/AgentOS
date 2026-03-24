/**
 * Workbench — the primary interface.
 *
 * Left: conversation with the AI (natural language input)
 * Right: dynamic visualization panel (AI-generated, scene-driven)
 *
 * This is NOT a workflow editor. The user speaks intent,
 * the AI works autonomously and uses visuals to guide the user's thinking.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Input, Tag, Spin, Empty, Button, Tooltip, Badge } from 'antd';
import {
  SendOutlined, ThunderboltOutlined, ToolOutlined,
  EyeOutlined, ClearOutlined, DollarOutlined,
} from '@ant-design/icons';
import DynamicVisual from '../components/DynamicVisual';

interface ChatMessage {
  role: 'user' | 'assistant' | 'thinking' | 'tool' | 'error';
  content: string;
  meta?: string;
  toolCalls?: any[];
}

interface Visual {
  type: string;
  title: string;
  data: any;
  description?: string;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Workbench() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const visualEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    visualEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visuals]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/api/sessions/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleEvent(event);
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'error', content: `Connection error: ${e.message}` }]);
    }

    setLoading(false);
  };

  const handleEvent = (event: any) => {
    switch (event.type) {
      case 'session_id':
        setSessionId(event.content);
        break;

      case 'thinking':
        // Show a subtle thinking indicator — don't add to chat to avoid clutter
        break;

      case 'text':
        setMessages(prev => [...prev, { role: 'assistant', content: event.content }]);
        break;

      case 'visual':
        setVisuals(prev => [...prev, event.content]);
        break;

      case 'tool_call':
        setMessages(prev => [...prev, {
          role: 'tool',
          content: `🔧 Calling: ${event.content.tool}`,
          meta: JSON.stringify(event.content.args, null, 2).substring(0, 200),
        }]);
        break;

      case 'tool_result':
        // Tool results are processed by the AI, no need to show raw data
        break;

      case 'done':
        setTotalCost(event.content.cost_cents || 0);
        setTotalTokens(event.content.tokens || 0);
        break;

      case 'error':
        setMessages(prev => [...prev, { role: 'error', content: typeof event.content === 'string' ? event.content : JSON.stringify(event.content) }]);
        break;
    }
  };

  const clearSession = () => {
    setMessages([]);
    setVisuals([]);
    setSessionId(null);
    setTotalCost(0);
    setTotalTokens(0);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0 }}>
      {/* ── Left: Conversation ── */}
      <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8e8e8', background: '#fff' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            <ThunderboltOutlined style={{ marginRight: 6, color: '#1890ff' }} />
            Agentic Work Studio
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {totalCost > 0 && <Tag icon={<DollarOutlined />}>¥{(totalCost / 100).toFixed(2)}</Tag>}
            {totalTokens > 0 && <Tag>{totalTokens.toLocaleString()} tokens</Tag>}
            <Tooltip title="New session"><Button size="small" icon={<ClearOutlined />} onClick={clearSession} /></Tooltip>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 80, color: '#999' }}>
              <ThunderboltOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
              <div style={{ fontSize: 16, marginBottom: 8 }}>Tell me what you want to do</div>
              <div style={{ fontSize: 13 }}>
                Try: "分析上个月的客户投诉数据" or "Help me plan a product launch"
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                background: m.role === 'user' ? '#1890ff' : m.role === 'error' ? '#fff1f0' : m.role === 'tool' ? '#f6ffed' : '#f5f5f5',
                color: m.role === 'user' ? '#fff' : m.role === 'error' ? '#cf1322' : '#333',
                border: m.role === 'error' ? '1px solid #ffa39e' : m.role === 'tool' ? '1px solid #b7eb8f' : 'none',
              }}>
                {m.role === 'tool' && <ToolOutlined style={{ marginRight: 4, color: '#52c41a' }} />}
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>{m.content}</div>
                {m.meta && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, fontFamily: 'monospace' }}>{m.meta}</div>}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#888', padding: '8px 0' }}>
              <Spin size="small" /> <span>Working on it...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
          <Input.Search
            value={input}
            onChange={e => setInput(e.target.value)}
            onSearch={send}
            onPressEnter={send}
            enterButton={<SendOutlined />}
            placeholder="Describe what you need..."
            size="large"
            loading={loading}
            autoFocus
          />
        </div>
      </div>

      {/* ── Right: Dynamic Visualization Panel ── */}
      <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            <EyeOutlined style={{ marginRight: 6 }} />
            Insights
            {visuals.length > 0 && <Badge count={visuals.length} style={{ marginLeft: 8 }} />}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {visuals.length === 0 && (
            <Empty
              description="Visualizations will appear here as the AI works"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 80 }}
            />
          )}

          {visuals.map((v, i) => (
            <DynamicVisual key={i} type={v.type} title={v.title} data={v.data} description={v.description} />
          ))}
          <div ref={visualEndRef} />
        </div>
      </div>
    </div>
  );
}
