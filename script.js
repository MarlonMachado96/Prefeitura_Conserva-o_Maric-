import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://gdzyyrhngcofbonsxwyd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkenl5cmhuZ2NvZmJvbnN4d3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjQyOTAsImV4cCI6MjA2NDA0MDI5MH0.2DvQG9vBEsJB5vh_8g68JOM7d8EONvdS_nm809UWRMk'
);

document.getElementById('chamadoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const telefone = document.getElementById('telefone').value;
  const endereco = document.getElementById('endereco').value;
  const observacoes = document.getElementById('observacoes').value;
  const imagemFile = document.getElementById('foto').files[0];

  let latitude = null;
  let longitude = null;

  // Função para enviar o chamado após pegar localização ou sem ela
  async function enviarChamado() {
    let imagem_url = null;

    if (imagemFile) {
      const fileExt = imagemFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chamados')
        .upload(filePath, imagemFile);

      if (uploadError) {
        alert('Erro ao fazer upload da imagem: ' + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('chamados').getPublicUrl(filePath);
      imagem_url = data.publicUrl;
    }

    const { error } = await supabase.from('chamados').insert([
      {
        nome,
        telefone,
        endereco,
        observacoes,
        url_foto: imagem_url,
        latitude,
        longitude,
        criado_em: new Date(),
      },
    ]);

    if (error) {
      alert('Erro ao enviar chamado: ' + error.message);
    } else {
      alert('Chamado enviado com sucesso!');
      document.getElementById('chamadoForm').reset();
      document.getElementById('localizacaoTexto').innerText = '';
    }
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        enviarChamado();
      },
      (error) => {
        console.warn('Erro ao obter localização:', error);
        enviarChamado();
      }
    );
  } else {
    enviarChamado();
  }
});


window.obterLocalizacao = async function () {
  const textoLocalizacao = document.getElementById('localizacaoTexto');
  textoLocalizacao.textContent = 'Obtendo localização...';

  if (!navigator.geolocation) {
    alert('Geolocalização não é suportada no seu navegador.');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await response.json();

      if (data.display_name) {
        document.getElementById('endereco').value = data.display_name;
        textoLocalizacao.textContent = 'Localização preenchida automaticamente.';
      } else {
        textoLocalizacao.textContent = 'Não foi possível obter o endereço.';
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      textoLocalizacao.textContent = 'Erro ao buscar endereço.';
    }
  }, (err) => {
    console.error('Erro na geolocalização:', err);
    textoLocalizacao.textContent = 'Erro ao obter localização.';
  });
};

// Mostrar preview das imagens selecionadas
document.getElementById('foto').addEventListener('change', function () {
  const previewContainer = document.getElementById('previewImagens');
  previewContainer.innerHTML = ''; // Limpa previews anteriores

  const arquivos = this.files;

  if (arquivos.length === 0) {
    previewContainer.innerHTML = '<p>Nenhuma imagem selecionada</p>';
    return;
  }

  for (const arquivo of arquivos) {
    if (!arquivo.type.startsWith('image/')) continue;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '150px';
      img.style.maxHeight = '150px';
      img.style.objectFit = 'cover';
      img.style.border = '1px solid #ccc';
      img.style.borderRadius = '8px';
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(arquivo);
  }
});
