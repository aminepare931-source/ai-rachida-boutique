/* Rachida AI — widget embarquable premium
   Usage : <script src="https://votredomaine/widget/rachida.js" data-shop="SLUG"></script>
*/
(function () {
  var script = document.currentScript;
  var shopSlug = script && script.getAttribute('data-shop');
  if (!shopSlug) { console.warn('[Rachida] data-shop manquant'); return; }
  var baseUrl = new URL(script.src).origin;
  var CART_KEY = 'rachida_cart_' + shopSlug;
  var CONTACT_KEY = 'rachida_contact_' + shopSlug;

  var savedContact = {};
  try { savedContact = JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch (e) {}

  var state = {
    open: false,
    config: null,
    messages: [],
    conversationId: null,
    emotion: 'neutre',
    leadScore: 1,
    clientName: savedContact.name || null,
    clientContact: savedContact.contact || null,
    loading: false,
    audioOn: false,
    listening: false,
    cart: [],
  };

  try { state.cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) {}

  var EMOTION_COLORS = {
    positif: '#10b981',
    négatif: '#ef4444',
    triste: '#3b82f6',
    questionneur: '#f59e0b',
    neutre: '#7c5cfc'
  };

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'style') Object.assign(e.style, attrs[k]);
      else if (k.indexOf('on') === 0) e[k] = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
    return e;
  }

  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) {} }
  function saveContact() { try { localStorage.setItem(CONTACT_KEY, JSON.stringify({ name: state.clientName, contact: state.clientContact })); } catch (e) {} }

  function speak(text) {
    if (!state.audioOn || !('speechSynthesis' in window)) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      u.rate = 1.05;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function startListening() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Reconnaissance vocale non supportée par ce navigateur.'); return; }
    var rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = false;
    state.listening = true; render();
    rec.onresult = function (ev) {
      var txt = ev.results[0][0].transcript;
      var input = document.getElementById('rachida-input');
      if (input) input.value = txt;
      send(txt);
    };
    rec.onerror = function () { state.listening = false; render(); };
    rec.onend = function () { state.listening = false; render(); };
    rec.start();
  }

  function render() {
    var existing = document.getElementById('rachida-root');
    if (existing) existing.remove();
    var color = (state.config && state.config.color) || '#7c5cfc';
    var glow = EMOTION_COLORS[state.emotion] || color;

    var bubble = el('button', {
      id: 'rachida-bubble',
      style: {
        position: 'fixed', bottom: '20px', right: '20px', width: '64px', height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg,' + color + ',' + glow + ')',
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: '0 10px 40px ' + glow + '66, 0 0 0 4px rgba(255,255,255,.1) inset',
        fontSize: '28px', zIndex: 999999,
        transition: 'all .3s ease', animation: state.open ? '' : 'rachida-pulse 2s ease-in-out infinite'
      },
      onclick: function () { state.open = !state.open; render(); }
    }, [state.open ? '×' : '💬']);

    var root = el('div', { id: 'rachida-root' }, [bubble]);

    if (state.open) {
      // Header with emotion halo + audio + cart
      var cartBtn = el('button', {
        title: 'Panier',
        style: { background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '999px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
        onclick: function () { showCart(); }
      }, ['🛒 ' + state.cart.length]);

      var audioBtn = el('button', {
        title: state.audioOn ? 'Couper le son' : 'Activer la voix',
        style: { background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '999px', cursor: 'pointer', fontSize: '14px' },
        onclick: function () { state.audioOn = !state.audioOn; if (!state.audioOn) window.speechSynthesis && window.speechSynthesis.cancel(); render(); }
      }, [state.audioOn ? '🔊' : '🔇']);

      var headerLeft = el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
        el('div', { style: { width: '10px', height: '10px', borderRadius: '50%', background: glow, boxShadow: '0 0 10px ' + glow } }),
        el('div', { style: { fontWeight: 700 } }, [(state.config ? state.config.rachida_name : 'Chat') + (state.leadScore >= 7 ? ' · 🔥' : '')]),
      ]);
      var header = el('div', {
        style: {
          padding: '14px 16px',
          background: 'linear-gradient(135deg,' + color + ',' + glow + ')',
          color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'
        }
      }, [headerLeft, el('div', { style: { display: 'flex', gap: '6px' } }, [cartBtn, audioBtn])]);

      var body = el('div', {
        id: 'rachida-body',
        style: { flex: 1, overflowY: 'auto', padding: '14px', background: '#fafafe', display: 'flex', flexDirection: 'column', gap: '10px' }
      });

      if (state.messages.length === 0 && state.config) {
        body.appendChild(bubbleMsg('assistant', state.config.greeting, color));
      }
      state.messages.forEach(function (m) { body.appendChild(bubbleMsg(m.role, m.content, color)); });
      if (state.loading) body.appendChild(typingIndicator(state.config ? state.config.rachida_name : 'Rachida'));

      var input = el('input', {
        id: 'rachida-input', type: 'text',
        placeholder: state.listening ? '🎤 Écoute en cours...' : 'Écris ton message...',
        style: { flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '999px', outline: 'none', fontSize: '14px', background: '#fff' }
      });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value); });

      var micBtn = el('button', {
        title: 'Parler',
        style: { padding: '10px 12px', background: state.listening ? '#ef4444' : '#f3f4f6', color: state.listening ? '#fff' : '#374151', border: 'none', borderRadius: '999px', cursor: 'pointer', fontSize: '16px' },
        onclick: startListening
      }, ['🎤']);

      var imgInput = el('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, id: 'rachida-img' });
      imgInput.addEventListener('change', function (e) { if (e.target.files && e.target.files[0]) uploadImage(e.target.files[0]); });
      var imgBtn = el('label', {
        for: 'rachida-img', title: 'Envoyer image / preuve paiement',
        style: { padding: '10px 12px', background: '#f3f4f6', borderRadius: '999px', cursor: 'pointer', fontSize: '16px', display: 'inline-flex', alignItems: 'center' }
      }, ['📷', imgInput]);

      var sendBtn = el('button', {
        style: { padding: '10px 16px', background: 'linear-gradient(135deg,' + color + ',' + glow + ')', color: '#fff', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: 600 },
        onclick: function () { send(input.value); }
      }, ['→']);

      var inputBar = el('div', { style: { display: 'flex', gap: '6px', padding: '10px 12px', background: '#fff', borderTop: '1px solid #f0f0f5', alignItems: 'center' } }, [micBtn, imgBtn, input, sendBtn]);

      var waBtn = state.config && state.config.whatsapp
        ? el('a', { href: 'https://wa.me/' + state.config.whatsapp.replace(/\D/g, ''), target: '_blank', style: { display: 'block', textAlign: 'center', padding: '8px', background: '#25d366', color: '#fff', textDecoration: 'none', fontSize: '12px', fontWeight: 600 } }, ['💬 Parler à un humain sur WhatsApp'])
        : null;

      var panel = el('div', {
        style: {
          position: 'fixed', bottom: '96px', right: '20px',
          width: '360px', height: '560px', maxHeight: 'calc(100vh - 120px)',
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.5) inset',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 999999, fontFamily: 'system-ui, -apple-system, sans-serif',
          animation: 'rachida-slidein .25s ease-out'
        }
      }, [header, body, waBtn, inputBar]);
      root.appendChild(panel);
    }

    if (!document.getElementById('rachida-style')) {
      var st = document.createElement('style');
      st.id = 'rachida-style';
      st.innerHTML = '@keyframes rachida-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@keyframes rachida-slidein{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes rachida-dot{0%,80%,100%{opacity:.3}40%{opacity:1}}.rachida-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin:0 2px;animation:rachida-dot 1.4s infinite}.rachida-dot:nth-child(2){animation-delay:.2s}.rachida-dot:nth-child(3){animation-delay:.4s}';
      document.head.appendChild(st);
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
        color: isUser ? '#fff' : '#1f2937',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        maxWidth: '82%', fontSize: '14px', lineHeight: '1.5',
        boxShadow: '0 2px 8px rgba(0,0,0,.06)', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
      }
    }, [text]);
  }

  function typingIndicator(name) {
    return el('div', { style: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px', padding: '4px 8px' } }, [
      el('span', {}, [name + ' réfléchit']),
      el('span', { html: '<span class="rachida-dot"></span><span class="rachida-dot"></span><span class="rachida-dot"></span>' })
    ]);
  }

  function showCart() {
    var color = (state.config && state.config.color) || '#7c5cfc';
    var total = state.cart.reduce(function (s, i) { return s + (i.price || 0) * (i.qty || 1); }, 0);
    var items = state.cart.length
      ? state.cart.map(function (i, idx) {
          return el('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f5', fontSize: '14px' } }, [
            el('span', {}, [i.name + ' ×' + (i.qty || 1)]),
            el('span', {}, [(i.price * (i.qty || 1)) + ' ' + (state.config ? state.config.currency : 'CFA')]),
            el('button', { style: { marginLeft: '8px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }, onclick: function () { state.cart.splice(idx, 1); saveCart(); document.getElementById('rachida-cart-modal').remove(); showCart(); } }, ['×'])
          ]);
        })
      : [el('p', { style: { color: '#9ca3af', textAlign: 'center', padding: '20px 0' } }, ['Panier vide. Demande à ' + (state.config ? state.config.rachida_name : 'Rachida') + ' de te conseiller !'])];

    var modal = el('div', {
      id: 'rachida-cart-modal',
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 },
      onclick: function (e) { if (e.target.id === 'rachida-cart-modal') e.target.remove(); }
    }, [
      el('div', { style: { background: '#fff', borderRadius: '20px', padding: '20px', width: '320px', maxWidth: '90vw' } }, [
        el('h3', { style: { margin: '0 0 12px', fontSize: '18px' } }, ['🛒 Mon panier']),
        el('div', {}, items),
        el('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #f0f0f5', fontWeight: 700 } }, [
          el('span', {}, ['Total']),
          el('span', {}, [total + ' ' + (state.config ? state.config.currency : 'CFA')])
        ]),
        el('button', {
          style: { width: '100%', marginTop: '14px', padding: '12px', background: color, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 },
          onclick: function () {
            document.getElementById('rachida-cart-modal').remove();
            send('Je veux commander : ' + state.cart.map(function (i) { return i.name + ' ×' + (i.qty || 1); }).join(', '));
          }
        }, ['Valider la commande'])
      ])
    ]);
    document.body.appendChild(modal);
  }

  function uploadImage(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      state.messages.push({ role: 'user', content: '📷 Image envoyée' });
      state.loading = true; render();

      fetch(baseUrl + '/api/public/rachida-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug: shopSlug, conversationId: state.conversationId, imageDataUrl: dataUrl, intent: 'auto' })
      }).then(function (r) { return r.json(); })
        .then(function (data) {
          state.loading = false;
          var a = data.analysis || {};
          var msg = a.description || 'Image reçue. ' + (a.montant ? 'Montant détecté : ' + a.montant : '');
          if (a.type === 'payment_proof' || a.montant) msg = '✅ Preuve de paiement reçue. ' + msg;
          state.messages.push({ role: 'assistant', content: msg });
          speak(msg);
          render();
        }).catch(function () {
          state.loading = false;
          state.messages.push({ role: 'assistant', content: 'Désolée, je n\'ai pas pu analyser cette image.' });
          render();
        });
    };
    reader.readAsDataURL(file);
  }

  function send(text) {
    text = (text || '').trim();
    if (!text || state.loading) return;
    state.messages.push({ role: 'user', content: text });
    var input = document.getElementById('rachida-input');
    if (input) input.value = '';
    state.loading = true;

    // Detect contact info
    var phoneMatch = text.match(/(\+?\d[\d\s]{6,})/);
    if (phoneMatch && !state.clientContact) { state.clientContact = phoneMatch[1].replace(/\s/g, ''); saveContact(); }
    var nameMatch = text.match(/(?:je m'appelle|moi c'est|mon nom)\s+([A-Za-zÀ-ÿ]+)/i);
    if (nameMatch && !state.clientName) { state.clientName = nameMatch[1]; saveContact(); }

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
      if (res.status === 429) {
        state.loading = false;
        state.messages.push({ role: 'assistant', content: 'Trop de messages d\'un coup, attends quelques secondes.' });
        render();
        return;
      }
      var convId = res.headers.get('X-Conversation-Id');
      if (convId) state.conversationId = convId;
      state.emotion = res.headers.get('X-Emotion') || state.emotion;
      state.leadScore = parseInt(res.headers.get('X-Lead-Score') || '1', 10);
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var acc = '';
      state.messages.push({ role: 'assistant', content: '' });
      state.loading = false;
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) { render(); speak(acc); return; }
          acc += decoder.decode(chunk.value, { stream: true });
          state.messages[state.messages.length - 1].content = acc;
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

  // Expose API for site integration
  window.RachidaAddToCart = function (product) {
    var existing = state.cart.find(function (i) { return i.name === product.name; });
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else state.cart.push({ name: product.name, price: product.price, qty: 1 });
    saveCart();
    if (state.open) render();
  };

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
