/**
 * Workbench — the product's primary interface.
 *
 * Layout: [Session list] [Chat] [Insights panel]
 *
 * - Users talk in natural language
 * - AI works autonomously (plans, calls tools, generates visuals)
 * - Visuals appear on the right as thinking aids
 * - Users can click visual elements or refer to them in follow-ups
 */
import React, { useState, useRef, useEffect } from 'react';
import { Input, Tag, Spin, Empty, Button, Tooltip, Badge } from 'antd';
import { SendOutlined, ThunderboltOutlined, ToolOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import DynamicVisual from '../components/DynamicVisual';
import { sessionApi } from '../services/api';

interface ChatMsg {
  role: 'user' | 'assistant' | 'tool' | 'error';
  content: string;
  meta?: string;
}

interface Visual {
  id: string; type: string; title: string; data: any; description?: string;
}

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Workbench() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(0);
  const chatEnd = useRef<HTMLDivElement>(null);
  const visEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { visEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [visuals]);
  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try { const r = await sessionApi.list(); setSessions(r.data); } catch {}
  };

  const newSession = () => {
    setSessionId(null); setMessages([]); setVisuals([]); setCost(0);
  };

  const loadSession = async (sid: string) => {
    try {
      const r = await sessionApi.get(sid);
      setSessionId(sid);
      setMessages(r.data.messages?.filter((m: any) => m.role === 'user' || m.role === 'assistant').map((m: any) => ({ role: m.role, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) })) || []);
      setVisuals(r.data.visuals || []);
      setCost(r.data.cost_cents || 0);
    } catch {}
  };

  // Click on a visual element → inject a follow-up question
  const onVisualClick = (visual: Visual, detail?: string) => {
    const question = detail || `关于"${visual.title}"再详细分析一下`;
    setInput(question);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(`${API}/api/sessions/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try { handleEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'error', content: e.message }]);
    }
    setLoading(false);
    loadSessions();
  };

  const handleEvent = (ev: any) => {
    switch (ev.type) {
      case 'session_id': setSessionId(ev.content); break;
      case 'text': setMessages(prev => [...prev, { role: 'assistant', content: ev.content }]); break;
      case 'visual': setVisuals(prev => [...prev, ev.content]); break;
      case 'tool_call': setMessages(prev => [...prev, { role: 'tool', content: `🔧 ${ev.content.tool}`, meta: JSON.stringify(ev.content.args).substring(0, 150) }]); break;
      case 'done': setCost(ev.content.cost_cents || 0); break;
      case 'error': setMessages(prev => [...prev, { role: 'error', content: typeof ev.content === 'string' ? ev.content : JSON.stringify(ev.content) }]); break;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* ── Session sidebar ── */}
      <div style={{ width: 200, borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="primary" size="small" block icon={<PlusOutlined />} onClick={newSession}>New session</Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', fontSize: 12 }}>
          {sessions.map(s => (
            <div key={s.id} onClick={() => loadSession(s.id)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                background: s.id === sessionId ? '#e6f7ff' : 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {s.title || 'Untitled'}
              </span>
              {s.visuals > 0 && <Badge count={s.visuals} size="small" style={{ marginLeft: 4 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat ── */}
      <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8e8e8' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span><ThunderboltOutlined style={{ color: '#1890ff' }} /> Agentic Work Studio</span>
          {cost > 0 && <Tag>¥{(cost / 100).toFixed(2)}</Tag>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 80, color: '#bbb' }}>
              <ThunderboltOutlined style={{ fontSize: 40, marginBottom: 12 }} />
              <div style={{ fontSize: 15, marginBottom: 4 }}>说出你想做的事</div>
              <div style={{ fontSize: 12 }}>例如：分析上月客户投诉 · 做一份竞品对比 · 策划促销方案</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '8px 12px', borderRadius: 10, fontSize: 14, lineHeight: 1.6,
                background: m.role === 'user' ? '#1890ff' : m.role === 'error' ? '#fff1f0' : m.role === 'tool' ? '#f6ffed' : '#f5f5f5',
                color: m.role === 'user' ? '#fff' : m.role === 'error' ? '#cf1322' : '#333',
                border: m.role === 'tool' ? '1px solid #b7eb8f' : m.role === 'error' ? '1px solid #ffa39e' : 'none',
              }}>
                {m.role === 'tool' && <ToolOutlined style={{ marginRight: 4, color: '#52c41a' }} />}
                <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
                {m.meta && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontFamily: 'monospace' }}>{m.meta}</div>}
              </div>
            </div>
          ))}
          {loading && <div style={{ color: '#aaa', fontSize: 13 }}><Spin size="small" /> Working...</div>}
          <div ref={chatEnd} />
        </div>

        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0' }}>
          <Input.Search value={input} onChange={e => setInput(e.target.value)} onSearch={send} enterButton={<SendOutlined />} placeholder="说出你想做的事..." size="large" loading={loading} autoFocus />
        </div>
      </div>

      {/* ── Insights panel ── */}
      <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600 }}>
          Insights {visuals.length > 0 && <Badge count={visuals.length} style={{ marginLeft: 6 }} />}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {visuals.length === 0 && <Empty description="AI生成的可视化将出现在这里" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 80 }} />}
          {visuals.map((v, i) => (
            <DynamicVisual key={v.id || i} {...v} onClick={(detail) => onVisualClick(v, detail)} />
          ))}
          <div ref={visEnd} />
        </div>
      </div>
    </div>
  );
}
