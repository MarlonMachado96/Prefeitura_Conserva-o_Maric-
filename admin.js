import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://gdzyyrhngcofbonsxwyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkenl5cmhuZ2NvZmJvbnN4d3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjQyOTAsImV4cCI6MjA2NDA0MDI5MH0.2DvQG9vBEsJB5vh_8g68JOM7d8EONvdS_nm809UWRMk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Verifica se já está logado ao carregar a página
if (localStorage.getItem('adminLogado') === 'true') {
  document.getElementById('loginArea').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'block';
  carregarChamados();
}

async function loginAdmin() {
  const email = document.getElementById('adminEmail').value.trim();
  const senha = document.getElementById('adminSenha').value;

  if (!email || !senha) {
    alert('Por favor, preencha email e senha.');
    return;
  }

  const { data: admin, error } = await supabase
    .from('administradores')
    .select('email, senha')
    .eq('email', email)
    .single();

  if (error || !admin) {
    alert('Usuário ou senha inválidos');
    return;
  }

  if (senha !== admin.senha) {
    alert('Usuário ou senha inválidos');
    return;
  }

  // Login OK
  localStorage.setItem('adminLogado', 'true');
  document.getElementById('loginArea').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'block';
  carregarChamados();
}

async function concluirChamado(id) {
  const { error } = await supabase
    .from('chamados')
    .update({ concluido_em: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert('Erro ao concluir chamado: ' + error.message);
  } else {
    alert('Chamado marcado como concluído.');
    carregarChamados(); // Atualiza a lista
  }
}

async function carregarChamados() {
  const container = document.getElementById('dadosChamados');
  container.innerHTML = '<h3>Chamados Recebidos:</h3>';

  const { data, error } = await supabase
    .from('chamados')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    container.innerHTML += `<p>Erro ao carregar chamados: ${error.message}</p>`;
    return;
  }

  if (data.length === 0) {
    container.innerHTML += '<p>Nenhum chamado encontrado.</p>';
  } else {
    data.forEach((c) => {
      container.innerHTML += `
        <div class="chamado">
          <p><strong>Nome:</strong> ${c.nome}</p>
          <p><strong>Telefone:</strong> ${c.telefone}</p>
          <p><strong>Endereço:</strong> ${c.endereco}</p>
          <p><strong>Observações:</strong> ${c.observacoes || '-'}</p>
          <p><strong>Data de abertura:</strong> ${new Date(c.criado_em).toLocaleString('pt-BR')}</p>
          <p><strong>Data de conclusão:</strong> ${c.concluido_em ? new Date(c.concluido_em).toLocaleString('pt-BR') : 'Não concluído'}</p>
          ${c.url_foto ? `<img src="${c.url_foto}" alt="Foto do chamado" />` : ''}
          ${!c.concluido_em ? `<button onclick="concluirChamado('${c.id}')">Concluir chamado</button>` : ''}
        </div>
      `;
    });
  }
  container.style.display = 'block';
}

// Expor função ao escopo global para funcionar no onclick do botão
window.concluirChamado = concluirChamado;

document.getElementById('loginBtn').addEventListener('click', loginAdmin);

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminLogado');
  document.getElementById('loginArea').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('dadosChamados').style.display = 'none';

  document.getElementById('adminEmail').value = '';
  document.getElementById('adminSenha').value = '';
});
