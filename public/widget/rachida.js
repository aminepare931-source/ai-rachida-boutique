/* Rachida AI — widget embarquable
   Usage : <script src="https://votredomaine/widget/rachida.js" data-shop="SLUG"></script>
*/
(function () {
  var script = document.currentScript;
  var shopSlug = script && script.getAttribute('data-shop');
  if (!shopSlug) { console.warn('[Rachida] data-shop manquant'); return; }
  var baseUrl = new URL(script.src).origin;

  var state = {
    open: false,
    config: null,
    messages: [],
    conversationId: null,
    emotion: 'neutre',
    clientName: null,
    clientContact: null,
  };

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'style') Object.assign(e.style, attrs[k]);
      else if (k === 'onclick') e.onclick = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
    return e;
  }

  function render() {
    var existing = document.getElementById('rachida-root');
    if (existing) existing.remove();
    var color = (state.config && state.config.color) || '#7c5cfc';

    var bubble = el('button', {
      id: 'rachida-bubble',
      style: { position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: color, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,.2)', fontSize: '28px', zIndex: 999999 },
      onclick: function () { state.open = !state.open; render(); }
    }, [state.open ? '×' : '💬']);

    var root = el('div', { id: 'rachida-root' }, [bubble]);

    if (state.open) {
      var header = el('div', { style: { padding: '14px 16px', background: color, color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
        (state.config ? state.config.rachida_name + ' · ' + state.config.name : 'Chat'),
      ]);

      var body = el('div', { id: 'rachida-body', style: { flex: 1, overflowY: 'auto', padding: '12px', background: '#f7f7fb', display: 'flex', flexDirection: 'column', gap: '8px' } });

      if (state.messages.length === 0 && state.config) {
        body.appendChild(bubbleMsg('assistant', state.config.greeting, color));
      }
      state.messages.forEach(function (m) { body.appendChild(bubbleMsg(m.role, m.content, color)); });
      if (state.loading) body.appendChild(bubbleMsg('assistant', '...', color));

      var input = el('input', { type: 'text', placeholder: 'Écris ton message...', style: { flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: '20px', outline: 'none', fontSize: '14px' } });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value, input); });
      var sendBtn = el('button', { style: { padding: '10px 14px', background: color, color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' }, onclick: function () { send(input.value, input); } }, ['→']);
      var inputBar = el('div', { style: { display: 'flex', gap: '8px', padding: '10px', background: '#fff', borderTop: '1px solid #eee' } }, [input, sendBtn]);

      var waBtn = state.config && state.config.whatsapp
        ? el('a', { href: 'https://wa.me/' + state.config.whatsapp.replace(/\D/g, ''), target: '_blank', style: { display: 'block', textAlign: 'center', padding: '6px', background: '#25d366', color: '#fff', textDecoration: 'none', fontSize: '12px' } }, ['💬 Parler à un humain sur WhatsApp'])
        : null;

      var panel = el('div', {
        style: { position: 'fixed', bottom: '90px', right: '20px', width: '340px', height: '500px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 999999, fontFamily: 'system-ui, sans-serif' }
      }, [header, body, waBtn, inputBar]);
      root.appendChild(panel);
    }

    document.body.appendChild(root);
    var b = document.getElementById('rachida-body');
    if (b) b.scrollTop = b.scrollHeight;
  }

  function bubbleMsg(role, text, color) {
    var isUser = role === 'user';
    return el('div', {
      style: {
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        background: isUser ? color : '#fff',
        color: isUser ? '#fff' : '#222',
        padding: '8px 12px', borderRadius: '14px', maxWidth: '80%', fontSize: '14px', lineHeight: '1.4',
        boxShadow: '0 1px 2px rgba(0,0,0,.06)', whiteSpace: 'pre-wrap'
      }
    }, [text]);
  }

  function send(text, inputEl) {
    text = (text || '').trim();
    if (!text || state.loading) return;
    state.messages.push({ role: 'user', content: text });
    if (inputEl) inputEl.value = '';
    state.loading = true;
    render();

    fetch(baseUrl + '/api/public/rachida-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopSlug: shopSlug,
        conversationId: state.conversationId,
        clientName: state.clientName,
        clientContact: state.clientContact,
        messages: state.messages,
      }),
    }).then(function (res) {
      var convId = res.headers.get('X-Conversation-Id');
      if (convId) state.conversationId = convId;
      state.emotion = res.headers.get('X-Emotion') || state.emotion;
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var acc = '';
      state.messages.push({ role: 'assistant', content: '' });
      state.loading = false;
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) { render(); return; }
          acc += decoder.decode(chunk.value, { stream: true });
          state.messages[state.messages.length - 1].content = acc;
          // detect contact info
          var phoneMatch = text.match(/(\+?\d[\d\s]{6,})/);
          if (phoneMatch && !state.clientContact) state.clientContact = phoneMatch[1].replace(/\s/g, '');
          render();
          return pump();
        });
      }
      return pump();
    }).catch(function (err) {
      console.error('[Rachida]', err);
      state.loading = false;
      state.messages.push({ role: 'assistant', content: 'Désolée, une erreur est survenue. Réessaie ou contacte-nous sur WhatsApp.' });
      render();
    });
  }

  // Load config
  fetch(baseUrl + '/api/public/shop-config?shop=' + encodeURIComponent(shopSlug))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.shop) {
        state.config = data.shop;
        render();
      } else {
        console.warn('[Rachida] boutique introuvable:', shopSlug);
      }
    })
    .catch(function (e) { console.error('[Rachida] config error', e); });
})();
