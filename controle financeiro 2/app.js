document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transactionForm');
    const valorInput = document.getElementById('valor');
    const tipoInput = document.getElementById('tipoTransacao');
    const categoriaInput = document.getElementById('categoria');
    const metodoInput = document.getElementById('metodoPagamento');
    const descricaoInput = document.getElementById('descricao');
    const dataInput = document.getElementById('dataTransacao');
    const feedback = document.getElementById('feedbackMessage');
    const corpoTabela = document.getElementById('corpoTabelaLancamentos');
    const filtroInicio = document.getElementById('filtroInicio');
    const filtroFim = document.getElementById('filtroFim');
    const btnFiltrar = document.getElementById('btnFiltrarLancamentos');
    const btnLimpar = document.getElementById('btnLimparFiltroLancamentos');

    const paginacaoEl = document.getElementById('paginacaoLancamentos'); // <div id="paginacaoLancamentos"></div>

    let modoEdicao = false;
    let idEdicao = null;
    let todasAsTransacoes = [];
    let transacoesFiltradas = [];
    const itensPorPagina = 5;
    let paginaAtual = 1;

    const svgEditar = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
     class="bi bi-pencil-fill" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M12.854.146a.5.5 0 0 1 .707 0l2.293 2.293a.5.5 0 0 1 0
           .707l-10 10a.5.5 0 0 1-.168.11l-5
           2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0
           1 .11-.168l10-10zM11.207 2 2 11.207V13h1.793L14
           3.793 11.207 2z"/>
</svg>
`;

const svgExcluir = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
     class="bi bi-trash3-fill" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853
           10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0
           1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1
           0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0
           1 11 1.5ZM6 1v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5
           0 0 0-.5.5ZM4.5 5.024l.5 8.5a.5.5 0 1
           0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm3.5
           .012l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0
           1 0-.998.06Zm3.5-.012l.5 8.5a.5.5 0 1 0
           .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Z"/>
</svg>
`;
const yearSpanMinimal = document.getElementById('currentYearMinimal');
  if (yearSpanMinimal) {
    yearSpanMinimal.textContent = new Date().getFullYear();
  }
    function exibirMensagem(msg, tipo) {
        feedback.textContent = msg;
        feedback.className = tipo;
        setTimeout(() => {
            feedback.textContent = '';
            feedback.className = '';
        }, 4000);
    }

    function preencherDataAtual() {
        const hoje = new Date();
        const offset = hoje.getTimezoneOffset();
        const local = new Date(hoje.getTime() - offset * 60000);
        dataInput.value = local.toISOString().split('T')[0];
    }

    preencherDataAtual();

    if (valorInput) {
        valorInput.addEventListener('blur', e => {
            const input = e.target.value.replace(',', '.');
            const valor = parseFloat(input);
            if (!isNaN(valor)) {
                e.target.value = valor.toFixed(2).replace('.', ',');
            }
        });
    }

    function formatarMoeda(valor) {
        const num = parseFloat(valor);
        if (isNaN(num)) return 'R$ 0,00';
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatarDataBR(dataISO) {
        try {
            const d = new Date(dataISO);
            const dia = String(d.getDate()).padStart(2, '0');
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const ano = d.getFullYear();
            return `${dia}/${mes}/${ano}`;
        } catch {
            return 'Data inválida';
        }
    }

    function renderizarTabela(pagina = 1) {
        if (!corpoTabela) return;

        const inicio = (pagina - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const paginaTransacoes = transacoesFiltradas.slice(inicio, fim);

        corpoTabela.innerHTML = '';

        if (paginaTransacoes.length === 0) {
            corpoTabela.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum lançamento encontrado.</td></tr>`;
            paginacaoEl.innerHTML = '';
            return;
        }

        paginaTransacoes.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatarDataBR(t.data)}</td>
                <td>${t.descricao || '-'}</td>
                <td>${t.categoria}</td>
                <td>${t.metodoPagamento}</td>
                <td style="text-align:right;">${formatarMoeda(t.valor)}</td>
                <td>
  <div style="display: flex; gap: 6px;">
    <button class="btn-editar" data-id="${t.id}">${svgEditar}</button>
    <button class="btn-excluir" data-id="${t.id}">${svgExcluir}</button>
  </div>
</td>

            `;
            corpoTabela.appendChild(tr);
        });

        // Paginação
        const totalPaginas = Math.ceil(transacoesFiltradas.length / itensPorPagina);
        paginacaoEl.innerHTML = `
            <div style="text-align:center; margin-top:10px;">
                Página ${paginaAtual} de ${totalPaginas}
                ${paginaAtual > 1 ? `<button id="prevPage">Anterior</button>` : ''}
                ${paginaAtual < totalPaginas ? `<button id="nextPage">Próxima</button>` : ''}
            </div>
        `;

        document.getElementById('prevPage')?.addEventListener('click', () => {
            paginaAtual--;
            renderizarTabela(paginaAtual);
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            paginaAtual++;
            renderizarTabela(paginaAtual);
        });

        // Botões editar/excluir
        corpoTabela.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = todasAsTransacoes.find(x => x.id === btn.dataset.id);
                if (t) entrarModoEdicao(t, t.id);
            });
        });

        corpoTabela.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm("Deseja excluir esta transação?")) {
                    const id = btn.dataset.id;
                    if (modoEdicao && id === idEdicao) sairModoEdicao();
                    database.ref('transacoes/' + id).remove().then(() => {
                        exibirMensagem("Transação excluída.", "success");
                    }).catch(err => exibirMensagem("Erro: " + err.message, "error"));
                }
            });
        });
    }

    function aplicarFiltros() {
        const inicioStr = filtroInicio?.value;
        const fimStr = filtroFim?.value;

        transacoesFiltradas = [...todasAsTransacoes];

        if (inicioStr) {
            const dataInicio = new Date(inicioStr + "T00:00:00");
            transacoesFiltradas = transacoesFiltradas.filter(t => new Date(t.data) >= dataInicio);
        }

        if (fimStr) {
            const dataFim = new Date(fimStr + "T23:59:59");
            transacoesFiltradas = transacoesFiltradas.filter(t => new Date(t.data) <= dataFim);
        }

        paginaAtual = 1;
        renderizarTabela();
    }

    if (btnFiltrar) btnFiltrar.addEventListener('click', aplicarFiltros);
    if (btnLimpar) btnLimpar.addEventListener('click', () => {
        definirFiltroPadrao();
        aplicarFiltros();
    });

    function definirFiltroPadrao() {
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        filtroInicio.value = primeiroDia.toISOString().split('T')[0];
        filtroFim.value = ultimoDia.toISOString().split('T')[0];
    }

    function carregarTransacoes() {
        if (typeof database === 'undefined') return;
        const ref = database.ref('transacoes');
        ref.on('value', snapshot => {
            todasAsTransacoes = [];
            snapshot.forEach(child => {
                todasAsTransacoes.push({ id: child.key, ...child.val() });
            });
            aplicarFiltros();
        });
    }

    function entrarModoEdicao(t, id) {
        modoEdicao = true;
        idEdicao = id;
        valorInput.value = parseFloat(t.valor).toFixed(2).replace('.', ',');
        tipoInput.value = t.tipoTransacao;
        categoriaInput.value = t.categoria;
        metodoInput.value = t.metodoPagamento;
        descricaoInput.value = t.descricao;
        dataInput.value = new Date(t.data).toISOString().split('T')[0];
        form.querySelector('button[type="submit"]').textContent = "Atualizar";
        adicionarBotaoCancelar();
    }

    function sairModoEdicao() {
        modoEdicao = false;
        idEdicao = null;
        form.reset();
        preencherDataAtual();
        form.querySelector('button[type="submit"]').textContent = "Salvar";
        removerBotaoCancelar();
    }

    function adicionarBotaoCancelar() {
        if (document.getElementById('cancelEditButton')) return;
        const btn = document.createElement('button');
        btn.id = 'cancelEditButton';
        btn.type = 'button';
        btn.textContent = "Cancelar Edição";
        btn.style.cssText = "margin-top:10px;width:100%;background:#6c757d;color:white;padding:10px;border:none;border-radius:4px;";
        btn.addEventListener('click', sairModoEdicao);
        form.appendChild(btn);
    }

    function removerBotaoCancelar() {
        document.getElementById('cancelEditButton')?.remove();
    }

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const valorStr = valorInput?.value.replace(',', '.') || '0';
        const valor = parseFloat(valorStr);
        const tipo = tipoInput?.value || '';
        const categoria = categoriaInput?.value || '';
        const metodo = metodoInput?.value || '';
        const descricao = descricaoInput?.value || '';
        const dataStr = dataInput?.value;

        if (isNaN(valor) || valor <= 0) return exibirMensagem("Valor inválido.", "error");
        if (!dataStr) return exibirMensagem("Data obrigatória.", "error");

        const dataISO = new Date(dataStr + "T00:00:00").toISOString();
        const transacao = { valor, tipoTransacao: tipo, categoria, metodoPagamento: metodo, descricao, data: dataISO };

        if (modoEdicao && idEdicao) {
            database.ref('transacoes/' + idEdicao).update(transacao).then(() => {
                exibirMensagem("Transação atualizada.", "success");
                sairModoEdicao();
            }).catch(err => exibirMensagem("Erro ao atualizar: " + err.message, "error"));
        } else {
            database.ref('transacoes').push(transacao).then(() => {
                exibirMensagem("Transação salva.", "success");
                form.reset();
                preencherDataAtual();
            }).catch(err => exibirMensagem("Erro ao salvar: " + err.message, "error"));
        }
    });

    if (filtroInicio && filtroFim) definirFiltroPadrao();
    if (typeof database !== 'undefined') carregarTransacoes();

    document.addEventListener('DOMContentLoaded', function() {
        const navToggle = document.querySelector('.nav-toggle');
        const mainNav = document.querySelector('.main-nav');
      
        if (navToggle && mainNav) {
          navToggle.addEventListener('click', function () {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            mainNav.classList.toggle('nav-open');
          });
        }
      });
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          document.querySelector('.main-nav').classList.remove('nav-open');
          document.querySelector('.nav-toggle').setAttribute('aria-expanded', false);
        });
      });
      
});
