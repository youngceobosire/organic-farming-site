(() => {
  const configured = window.SUPABASE_URL && !window.SUPABASE_URL.includes('YOUR_PROJECT') && window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  const loginView = document.querySelector('#loginView');
  const dashboard = document.querySelector('#dashboard');
  const loginForm = document.querySelector('#loginForm');
  const loginMessage = document.querySelector('#loginMessage');
  const status = document.querySelector('#status');
  const logout = document.querySelector('#logout');
  const productsEl = document.querySelector('#products');
  let client;
  let products = [];

  function message(text, error = false) {
    loginMessage.textContent = text;
    loginMessage.className = `notice${error ? ' error' : ''}`;
  }
  function setStatus(text, error = false) {
    status.textContent = text;
    status.style.color = error ? '#a93636' : '';
  }
  function requireConfig() {
    if (!configured) {
      message('Admin setup is incomplete. Copy supabase-config.example.js to supabase-config.js and add your Supabase URL and anon key.', true);
      loginForm.querySelector('button').disabled = true;
      return false;
    }
    return true;
  }
  function showDashboard() {
    loginView.classList.add('hidden'); dashboard.classList.remove('hidden'); logout.classList.remove('hidden');
    loadContent();
  }
  function showLogin() {
    loginView.classList.remove('hidden'); dashboard.classList.add('hidden'); logout.classList.add('hidden');
  }
  async function loadContent() {
    setStatus('Loading content...');
    const { data, error } = await client.from('site_content').select('content_key,value');
    if (error) { setStatus(`Could not load content: ${error.message}`, true); return; }
    const values = Object.fromEntries((data || []).map(row => [row.content_key, row.value]));
    const settings = values.settings || { heroTitle: 'Fresh, healthy food grown with purpose.', heroText: '', aboutText: '', phone: '+254 792191671', email: 'youngceoorganicfarm@gmail.com' };
    document.querySelector('#heroTitle').value = settings.heroTitle || '';
    document.querySelector('#heroText').value = settings.heroText || '';
    document.querySelector('#aboutText').value = settings.aboutText || '';
    document.querySelector('#phone').value = settings.phone || '';
    document.querySelector('#emailSetting').value = settings.email || '';
    products = values.products || [];
    renderProducts(); setStatus('Content loaded.');
  }
  function renderProducts() {
    productsEl.innerHTML = products.length ? products.map((p, i) => `<article class="product"><div class="product-head"><h3>${escapeHtml(p.name)}</h3><button class="btn danger" data-delete="${i}" type="button">Delete</button></div><div class="product-row">${p.image ? `<img src="${escapeAttr(p.image)}" alt="">` : ''}<div style="flex:1"><div class="field"><label>Category</label><input data-field="category" data-index="${i}" value="${escapeAttr(p.category)}"></div><div class="field"><label>Price (KSh)</label><input data-field="price" data-index="${i}" type="number" min="0" value="${Number(p.price) || 0}"></div><div class="field"><label>Description</label><textarea data-field="description" data-index="${i}">${escapeHtml(p.description)}</textarea></div><div class="field"><label>Replace image</label><input data-image="${i}" type="file" accept="image/*"></div><button class="btn" data-save="${i}" type="button">Save product</button></div></div></article>`).join('') : '<p class="muted">No products yet.</p>';
    productsEl.querySelectorAll('[data-delete]').forEach(b => b.onclick = () => { products.splice(Number(b.dataset.delete), 1); saveProducts(); });
    productsEl.querySelectorAll('[data-save]').forEach(b => b.onclick = () => saveProduct(Number(b.dataset.save)));
  }
  async function upload(file) {
    if (!file) return null;
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const path = `${crypto.randomUUID()}-${safe}`;
    const { error } = await client.storage.from('farm-images').upload(path, file, { upsert: false });
    if (error) throw error;
    return client.storage.from('farm-images').getPublicUrl(path).data.publicUrl;
  }
  async function saveProducts() {
    await upsert('products', products); renderProducts();
  }
  async function saveProduct(index) {
    const card = productsEl.querySelectorAll('.product')[index];
    products[index].category = card.querySelector('[data-field="category"]').value;
    products[index].price = Number(card.querySelector('[data-field="price"]').value);
    products[index].description = card.querySelector('[data-field="description"]').value;
    try { const file = card.querySelector('[data-image]').files[0]; if (file) products[index].image = await upload(file); await saveProducts(); setStatus('Product saved.'); } catch (e) { setStatus(e.message, true); }
  }
  async function upsert(key, value) {
    const { error } = await client.from('site_content').upsert({ content_key: key, value, updated_at: new Date().toISOString() }, { onConflict: 'content_key' });
    if (error) throw error;
  }
  function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(value = '') { return escapeHtml(value); }

  loginForm.addEventListener('submit', async e => { e.preventDefault(); if (!requireConfig()) return; const { error } = await client.auth.signInWithPassword({ email: document.querySelector('#email').value, password: document.querySelector('#password').value }); if (error) return message(error.message, true); message(''); showDashboard(); });
  logout.addEventListener('click', async () => { await client.auth.signOut(); showLogin(); });
  document.querySelector('#settingsForm').addEventListener('submit', async e => { e.preventDefault(); try { await upsert('settings', { heroTitle: heroTitle.value, heroText: heroText.value, aboutText: aboutText.value, phone: phone.value, email: emailSetting.value }); setStatus('Settings saved.'); } catch (err) { setStatus(err.message, true); } });
  document.querySelector('#productForm').addEventListener('submit', async e => { e.preventDefault(); try { const image = await upload(productImage.files[0]); products.push({ name: productName.value, category: productCategory.value, price: Number(productPrice.value), description: productDescription.value, image }); await saveProducts(); e.target.reset(); setStatus('Product added.'); } catch (err) { setStatus(err.message, true); } });
  if (configured) { client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY); client.auth.getSession().then(({ data }) => data.session ? showDashboard() : showLogin()); client.auth.onAuthStateChange((_event, session) => session ? showDashboard() : showLogin()); } else requireConfig();
})();
