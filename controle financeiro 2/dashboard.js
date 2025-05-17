document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos do DOM (do seu código original)
    const totalGastoMesEl = document.getElementById('totalGastoMes');
    const gastoPorTipoChartCtx = document.getElementById('gastoPorTipoChart')?.getContext('2d');
    const comparativoMensalChartCtx = document.getElementById('comparativoMensalChart')?.getContext('2d');
    const gastosCartoesContainerEl = document.getElementById('gastosCartoesContainer');
    const mesFiltroEl = document.getElementById('mesFiltro');
    const anoFiltroEl = document.getElementById('anoFiltro');
    const aplicarFiltroBtn = document.getElementById('aplicarFiltro');

    // NOVOS Elementos DOM para Filtro de Período
    const tipoFiltroEl = document.getElementById('tipoFiltro');
    const filtroMesAnoContainerEl = document.getElementById('filtroMesAnoContainer');
    const filtroPeriodoContainerEl = document.getElementById('filtroPeriodoContainer');
    const dataInicioFiltroEl = document.getElementById('dataInicioFiltro');
    const dataFimFiltroEl = document.getElementById('dataFimFiltro');

    const totalDisponivelCartoesEl = document.getElementById('totalDisponivelCartoes');
    const disponivelPorCartaoContainerEl = document.getElementById('disponivelPorCartaoContainer');

    let gastoPorTipoChartInstance;
    let comparativoMensalChartInstance;

    const cartoesConfig = {
        "cartaoitaublack": { limite: 500, diaFechamento: 5 },
        "cartaoxp": { limite: 500, diaFechamento: 10 },
        "cartaosantander": { limite: 200, diaFechamento: 25 }
    };

    function popularFiltros() {
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();

        if (anoFiltroEl) {
            for (let i = anoAtual - 3; i <= anoAtual + 1; i++) {
                const option = document.createElement('option');
                option.value = i; option.textContent = i;
                if (i === anoAtual) option.selected = true;
                anoFiltroEl.appendChild(option);
            }
        }
        if (mesFiltroEl) {
            const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            nomesMeses.forEach((nome, index) => {
                const option = document.createElement('option');
                option.value = index; option.textContent = nome;
                if (index === mesAtual) option.selected = true;
                mesFiltroEl.appendChild(option);
            });
        }
        if (dataInicioFiltroEl) {
            dataInicioFiltroEl.value = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        }
        if (dataFimFiltroEl) {
            dataFimFiltroEl.value = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
        }
    }

    if (tipoFiltroEl && filtroMesAnoContainerEl && filtroPeriodoContainerEl) {
        tipoFiltroEl.addEventListener('change', function() {
            const isMesAno = this.value === 'mesAno';
            filtroMesAnoContainerEl.style.display = isMesAno ? 'flex' : 'none';
            filtroPeriodoContainerEl.style.display = isMesAno ? 'none' : 'flex';
        });
        const initialIsMesAno = tipoFiltroEl.value === 'mesAno';
        filtroMesAnoContainerEl.style.display = initialIsMesAno ? 'flex' : 'none';
        filtroPeriodoContainerEl.style.display = initialIsMesAno ? 'none' : 'flex';
    } else {
        console.warn("Elementos para alternância de tipo de filtro não encontrados. A seleção de tipo de filtro pode não funcionar.");
        // Se o seletor de tipo não existir, esconde o filtro de período por segurança
        if(filtroPeriodoContainerEl) filtroPeriodoContainerEl.style.display = 'none';
        if(filtroMesAnoContainerEl) filtroMesAnoContainerEl.style.display = 'flex'; // Assume Mês/Ano como padrão
    }

    function getCicloFaturamentoAtual(diaFechamentoCartao) {
        const hoje = new Date();
        const anoAtual = hoje.getFullYear(); const mesAtual = hoje.getMonth(); const diaAtual = hoje.getDate();
        let dataFimCiclo = new Date(anoAtual, mesAtual, diaFechamentoCartao);
        let dataInicioCiclo;
        if (diaAtual > diaFechamentoCartao) {
            dataFimCiclo.setMonth(mesAtual + 1);
            dataInicioCiclo = new Date(anoAtual, mesAtual, diaFechamentoCartao + 1);
        } else {
            dataInicioCiclo = new Date(anoAtual, mesAtual - 1, diaFechamentoCartao + 1);
        }
        dataInicioCiclo.setHours(0, 0, 0, 0);
        dataFimCiclo.setHours(23, 59, 59, 999);
        console.log(`Cartão (dia fech. ${diaFechamentoCartao}): Ciclo Início: ${dataInicioCiclo}, Ciclo Fim: ${dataFimCiclo}`);
        return { inicio: dataInicioCiclo, fim: dataFimCiclo };
    }

    // --- NOVA FUNÇÃO AUXILIAR PARA OBTER O PERÍODO DE FILTRO ---
    function obterPeriodoDeFiltro() {
        let dataInicio, dataFim;
        const tipoFiltroSelecionado = (tipoFiltroEl && tipoFiltroEl.value) ? tipoFiltroEl.value : 'mesAno'; // Padrão
        console.log("Tipo de Filtro Selecionado:", tipoFiltroSelecionado);

        if (tipoFiltroSelecionado === 'mesAno') {
            if (mesFiltroEl && anoFiltroEl && mesFiltroEl.value !== "" && anoFiltroEl.value !== "") {
                const mes = parseInt(mesFiltroEl.value);
                const ano = parseInt(anoFiltroEl.value);
                dataInicio = new Date(ano, mes, 1, 0, 0, 0, 0);
                dataFim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);
            } else {
                console.warn("Filtros de Mês/Ano não estão selecionados ou não existem. Usando mês atual como padrão.");
                const hoje = new Date();
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0,0,0,0);
                dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23,59,59,999);
            }
        } else { // tipoFiltroSelecionado === 'periodo'
            if (dataInicioFiltroEl && dataFimFiltroEl && dataInicioFiltroEl.value && dataFimFiltroEl.value) {
                dataInicio = new Date(dataInicioFiltroEl.value);
                dataInicio.setUTCHours(0,0,0,0); // Interpreta a data do input como local e ajusta para UTC 00:00:00

                dataFim = new Date(dataFimFiltroEl.value);
                dataFim.setUTCHours(23,59,59,999); // Interpreta a data do input como local e ajusta para UTC 23:59:59

                if (dataInicio > dataFim) {
                    alert("A data de início não pode ser maior que a data de fim.");
                    return null; // Indica erro
                }
            } else {
                alert("Por favor, selecione as datas de início e fim para o filtro de período.");
                return null; // Indica erro
            }
        }
        console.log("Data Início Calculada:", dataInicio, "Data Fim Calculada:", dataFim);
        return { inicio: dataInicio, fim: dataFim };
    }


    async function carregarDadosDashboard() {
        const periodoFiltro = obterPeriodoDeFiltro();

        if (!periodoFiltro) { // Se obterPeriodoDeFiltro retornou null (erro de data)
            console.log("Período de filtro inválido. Carregamento de dados abortado.");
            // Limpar feedbacks de carregamento para não ficarem presos
            if (totalGastoMesEl) totalGastoMesEl.textContent = formatarMoeda(0);
            // ... outros elementos a serem resetados ...
            return;
        }

        const { inicio: dataInicioSelecionada, fim: dataFimSelecionada } = periodoFiltro;

        if (totalGastoMesEl) totalGastoMesEl.textContent = 'Carregando...';
        if (gastosCartoesContainerEl) gastosCartoesContainerEl.innerHTML = '<p>Carregando...</p>';
        if (disponivelPorCartaoContainerEl) disponivelPorCartaoContainerEl.innerHTML = '<p>Calculando...</p>';

        try {
            const snapshot = await database.ref('transacoes').once('value');
            const todasTransacoesDoBanco = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    todasTransacoesDoBanco.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });
            }
            console.log("Total de transações do banco:", todasTransacoesDoBanco.length);

            const transacoesDoPeriodoSelecionado = todasTransacoesDoBanco.filter(t => {
                if (!t.data) { console.warn("Transação sem data:", t); return false; }
                const dataTransacao = new Date(t.data); // Asume que t.data é uma string ISO (UTC)
                return dataTransacao >= dataInicioSelecionada &&
                       dataTransacao <= dataFimSelecionada &&
                       t.tipoTransacao === "Gasto";
            });
            console.log("Transações filtradas para o período:", transacoesDoPeriodoSelecionado.length);

            // Atualizar títulos das seções
            const h2Resumo = document.querySelector('#resumo-mes-atual h2');
            const h2GastosCat = document.querySelector('#gastos-por-categoria h2');
            const tipoFiltroAtual = (tipoFiltroEl && tipoFiltroEl.value) ? tipoFiltroEl.value : 'mesAno';

            if (tipoFiltroAtual === 'periodo') {
                const inicioFormatado = dataInicioSelecionada.toLocaleDateString('pt-BR', {timeZone: 'UTC'}); // Mostra a data UTC formatada
                const fimFormatado = dataFimSelecionada.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                if (h2Resumo) h2Resumo.textContent = `Resumo do Período (${inicioFormatado} - ${fimFormatado})`;
                if (h2GastosCat) h2GastosCat.textContent = `Gastos por Categoria (${inicioFormatado} - ${fimFormatado})`;
            } else {
                if (h2Resumo) h2Resumo.textContent = 'Resumo do Mês Selecionado';
                if (h2GastosCat) h2GastosCat.textContent = 'Gastos por Categoria (Mês Selecionado)';
            }

            if (totalGastoMesEl) calcularEExibirTotalGasto(transacoesDoPeriodoSelecionado);
            if (gastoPorTipoChartCtx) calcularEExibirGastosPorCategoria(transacoesDoPeriodoSelecionado);

            let anoReferenciaComparativo = dataFimSelecionada ? dataFimSelecionada.getUTCFullYear() : new Date().getUTCFullYear();
            if (comparativoMensalChartCtx) calcularEExibirComparativoMensal(todasTransacoesDoBanco, anoReferenciaComparativo);

            if (gastosCartoesContainerEl) calcularEExibirUsoCartoes(todasTransacoesDoBanco);
            if (disponivelPorCartaoContainerEl && totalDisponivelCartoesEl) calcularEExibirDisponivelParaGastar(todasTransacoesDoBanco);

        } catch (error) {
            console.error("Erro DENTRO do try/catch de carregarDadosDashboard:", error);
            if (totalGastoMesEl) totalGastoMesEl.textContent = 'Erro ao carregar';
            // ...
        }
    }

    // Funções de cálculo e exibição (como no seu código original)
    function formatarMoeda(valor) {
        const num = parseFloat(valor);
        if(isNaN(num)) return "R$ 0,00";
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function calcularEExibirTotalGasto(transacoesDoMes) {
        const total = transacoesDoMes.reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
        if (totalGastoMesEl) totalGastoMesEl.textContent = formatarMoeda(total);
    }

    function calcularEExibirGastosPorCategoria(transacoesDoMes) {
        // ... (seu código com layout.padding) ...
        const gastosPorCategoria = {};
        transacoesDoMes.forEach(t => {
            if(t.categoria && t.valor) {
                 gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + parseFloat(t.valor);
            }
        });
        const labels = Object.keys(gastosPorCategoria);
        const data = Object.values(gastosPorCategoria);
        if (gastoPorTipoChartInstance) gastoPorTipoChartInstance.destroy();
        if (gastoPorTipoChartCtx) { // Verifica se o contexto do canvas existe
            gastoPorTipoChartInstance = new Chart(gastoPorTipoChartCtx, {
                type: 'pie',
                data: { labels: labels, datasets: [{ label: 'Gastos por Categoria', data: data, /* ... cores ... */ }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top'}}, layout: { padding: { top: 10, bottom: 80, left: 10, right: 10 }} }
            });
        }
    }

    function calcularEExibirComparativoMensal(todasAsTransacoes, anoReferencia) {
        // ... (seu código com layout.padding) ...
        const gastosMensais = {};
        todasAsTransacoes.forEach(t => {
            if (t.tipoTransacao === "Gasto" && t.data && t.valor) {
                const dataTransacao = new Date(t.data);
                const ano = dataTransacao.getUTCFullYear(); // Use UTC para consistência com Firebase
                const mes = dataTransacao.getUTCMonth();
                const chaveMesAno = `${ano}-${String(mes).padStart(2, '0')}`;
                gastosMensais[chaveMesAno] = (gastosMensais[chaveMesAno] || 0) + parseFloat(t.valor);
            }
        });
        const chavesOrdenadas = Object.keys(gastosMensais).sort();
        const labelsComparativo = []; const dataComparativo = [];
        const ultimosMesesComDados = chavesOrdenadas.slice(-12);
        ultimosMesesComDados.forEach(chave => {
            const [anoStr, mesNumStr] = chave.split('-');
            const nomeMes = new Date(Date.UTC(parseInt(anoStr), parseInt(mesNumStr), 1)).toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' });
            labelsComparativo.push(`${nomeMes}/${anoStr.slice(2)}`);
            dataComparativo.push(gastosMensais[chave]);
        });
        if (comparativoMensalChartInstance) comparativoMensalChartInstance.destroy();
        if (comparativoMensalChartCtx) { // Verifica se o contexto do canvas existe
            comparativoMensalChartInstance = new Chart(comparativoMensalChartCtx, {
                type: 'line',
                data: { labels: labelsComparativo, datasets: [{ label: 'Total Gasto por Mês', data: dataComparativo, borderColor: 'rgb(75, 192, 192)', tension: 0.1 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top'}}, layout: { padding: { top: 10, bottom: 80, left: 10, right: 10 }}, scales: { y: { beginAtZero: true } } }
            });
        }
    }

    function calcularEExibirUsoCartoes(todasAsTransacoes) {
        if (!gastosCartoesContainerEl) {
            console.warn("Elemento 'gastosCartoesContainerEl' não encontrado. Seção de uso de cartões não será renderizada.");
            return;
        }
        gastosCartoesContainerEl.innerHTML = ''; // Limpa conteúdo anterior
    
        if (Object.keys(cartoesConfig).length === 0) {
            gastosCartoesContainerEl.innerHTML = '<p>Nenhum cartão configurado.</p>';
            return;
        }
    
        Object.keys(cartoesConfig).forEach(nomeCartao => {
            const configCartao = cartoesConfig[nomeCartao];
            // Validação da configuração do cartão
            if (!configCartao || typeof configCartao.limite !== 'number' || typeof configCartao.diaFechamento !== 'number') {
                console.warn(`Configuração incompleta ou inválida para o cartão (Uso): ${nomeCartao}. Pulando este cartão.`);
                const erroDiv = document.createElement('div');
                erroDiv.className = 'cartao-uso-item cartao-config-erro'; // Mesma classe de erro
                erroDiv.innerHTML = `<strong>${nomeCartao}</strong><p style="color: red;">Configuração do cartão incompleta ou inválida.</p>`;
                gastosCartoesContainerEl.appendChild(erroDiv);
                return;
            }
    
            const limite = parseFloat(configCartao.limite);
            const { inicio: inicioCiclo, fim: fimCiclo } = getCicloFaturamentoAtual(configCartao.diaFechamento);
    
            const gastosNoCicloDoCartao = todasAsTransacoes
                .filter(t => {
                    if (!t.data || !t.metodoPagamento || typeof t.valor === 'undefined' || t.valor === null) {
                        return false;
                    }
                    const dataTransacao = new Date(t.data);
                    return t.metodoPagamento === nomeCartao &&
                           t.tipoTransacao === "Gasto" &&
                           dataTransacao >= inicioCiclo &&
                           dataTransacao <= fimCiclo;
                })
                .reduce((acc, t) => acc + parseFloat(t.valor), 0);
    
            const percentualUsado = limite > 0 ? (gastosNoCicloDoCartao / limite) * 100 : 0;
            const textoCiclo = `Ciclo Atual: ${inicioCiclo.toLocaleDateString('pt-BR')} - ${fimCiclo.toLocaleDateString('pt-BR')}`;
    
            // Lógica de cor da barra para "Usado" (como você já tinha, mas podemos padronizar os breakpoints se quiser)
            let corDaBarra;
            if (percentualUsado > 90) { // Muito usado
                corDaBarra = '#d9534f'; // Vermelho
            } else if (percentualUsado > 70) { // Usado
                corDaBarra = '#f0ad4e'; // Laranja
            } else if (percentualUsado > 40) { // Moderadamente usado
                corDaBarra = '#5bc0de'; // Azul claro
            } else { // Pouco usado
                corDaBarra = '#5cb85c'; // Verde
            }
            // Se o gasto for 0 mas o limite existe, mantém verde. Se limite 0, barra neutra.
            if (limite === 0) {
                 corDaBarra = '#e9ecef'; // Cor da trilha, indicando que não há limite para medir
            }
    
    
            const textoNaBarra = percentualUsado > 1 || (gastosNoCicloDoCartao > 0 && limite > 0) ? `${percentualUsado.toFixed(0)}%` : ''; // Mostra % se > 1% ou se houver gasto em um limite > 0
    
            const cartaoDiv = document.createElement('div');
            // USA A MESMA CLASSE 'cartao-uso-item' para garantir design idêntico
            cartaoDiv.className = 'cartao-uso-item';
    
            cartaoDiv.innerHTML = `
                <div class="cartao-info">
                    <strong>${nomeCartao}</strong>
                    <small class="ciclo-info">${textoCiclo}</small> <!-- Mantém a classe ciclo-info -->
                    <span>Gasto no Ciclo: ${formatarMoeda(gastosNoCicloDoCartao)}</span>
                    <span>Limite Total: ${formatarMoeda(limite)}</span>
                </div>
                <div class="progress-bar-wrapper" title="Utilizado: ${percentualUsado.toFixed(1)}%">
                    <div class="progress-bar-filled" style="width: ${Math.min(percentualUsado, 100)}%; background-color: ${corDaBarra};">
                        ${textoNaBarra}
                    </div>
                </div>
            `;
            gastosCartoesContainerEl.appendChild(cartaoDiv);
        });
    }
    function calcularEExibirDisponivelParaGastar(todasAsTransacoes) {
        if (!disponivelPorCartaoContainerEl) { // Verifica o contêiner correto
            console.warn("Elemento 'disponivelPorCartaoContainerEl' não encontrado. Seção 'O Que Posso Gastar' não será renderizada.");
            return;
        }
        disponivelPorCartaoContainerEl.innerHTML = ''; // Limpa conteúdo anterior
    
        if (!totalDisponivelCartoesEl) { // Verifica o elemento para o total
            console.warn("Elemento 'totalDisponivelCartoesEl' não encontrado. Total disponível não será atualizado.");
        }
    
        if (Object.keys(cartoesConfig).length === 0) {
            disponivelPorCartaoContainerEl.innerHTML = '<p>Nenhum cartão configurado.</p>';
            if (totalDisponivelCartoesEl) totalDisponivelCartoesEl.textContent = formatarMoeda(0); // Atualiza o total para 0
            return;
        }
    
        let somaTotalDisponivelGlobal = 0; // Para calcular o total disponível em todos os cartões
    
        Object.keys(cartoesConfig).forEach(nomeCartao => {
            const configCartao = cartoesConfig[nomeCartao];
            // Validação da configuração do cartão
            if (!configCartao || typeof configCartao.limite !== 'number' || typeof configCartao.diaFechamento !== 'number') {
                console.warn(`Configuração incompleta ou inválida para o cartão (Disponível): ${nomeCartao}. Pulando este cartão.`);
                const erroDiv = document.createElement('div');
                // Usa a mesma e para erro, o CSS pode tratar '.cartao-uso-item.cartao-config-erro'
                erroDiv.className = 'cartao-uso-item cartao-config-erro';
                erroDiv.innerHTML = `<strong>${nomeCartao}</strong><p style="color: red;">Configuração do cartão incompleta ou inválida.</p>`;
                disponivelPorCartaoContainerEl.appendChild(erroDiv);
                return;
            }
    
            const limite = parseFloat(configCartao.limite);
            // Reutiliza a função getCicloFaturamentoAtual para consistência
            const { inicio: inicioCiclo, fim: fimCiclo } = getCicloFaturamentoAtual(configCartao.diaFechamento);
    
            const gastosNoCicloDoCartao = todasAsTransacoes
                .filter(t => {
                    if (!t.data || !t.metodoPagamento || typeof t.valor === 'undefined' || t.valor === null) {
                        return false;
                    }
                    const dataTransacao = new Date(t.data);
                    return t.metodoPagamento === nomeCartao &&
                           t.tipoTransacao === "Gasto" &&
                           dataTransacao >= inicioCiclo &&
                           dataTransacao <= fimCiclo;
                })
                .reduce((acc, t) => acc + parseFloat(t.valor), 0);
    
            const disponivelNoCartao = Math.max(0, limite - gastosNoCicloDoCartao);
            somaTotalDisponivelGlobal += disponivelNoCartao;
    
            // Percentual do limite que está DISPONÍVEL
            const percentualDisponivel = limite > 0 ? (disponivelNoCartao / limite) * 100 : (limite === 0 ? 0 : 100); // Se limite 0, disponível é 0%. Se limite > 0 e disponível é 0, é 0%. Se limite > 0 e disponível é igual ao limite, é 100%.
    
    
            // Lógica de cor da barra para "Disponível" (inversa da de "Usado")
            // Barra cheia (muito disponível) = verde
            // Barra vazia (pouco disponível) = vermelho
            let corDaBarra;
            if (percentualDisponivel >= 90) { // Muito disponível
                corDaBarra = '#5cb85c'; // Verde
            } else if (percentualDisponivel >= 60) {
                corDaBarra = '#5bc0de'; // Azul claro
            } else if (percentualDisponivel >= 30) {
                corDaBarra = '#f0ad4e'; // Laranja
            } else { // < 30% disponível
                corDaBarra = '#d9534f'; // Vermelho
            }
            // Se o limite for 0, a barra não deve ter cor de "disponível" ou deve ser neutra
            if (limite === 0) {
                 corDaBarra = '#e9ecef'; // Cor da trilha, indicando que não há limite para medir
            }
    
    
            const textoNaBarra = percentualDisponivel > 1 || (disponivelNoCartao === 0 && limite > 0) ? `${percentualDisponivel.toFixed(0)}%` : ''; // Mostra % se > 1% ou se for 0% de um limite > 0
    
            const cartaoDiv = document.createElement('div');
            // USA A MESMA CLASSE 'cartao-uso-item' para garantir design idêntico
            cartaoDiv.className = 'cartao-uso-item';
    
            cartaoDiv.innerHTML = `
                <div class="cartao-info">
                    <strong>${nomeCartao}</strong>
                    <!-- Não mostra o ciclo aqui, pois o foco é no disponível geral -->
                    <span>Limite Disponível: ${formatarMoeda(disponivelNoCartao)}</span>
                    <small class="detalhe-limite">(Limite Total: ${formatarMoeda(limite)})</small>
                </div>
                <div class="progress-bar-wrapper" title="Disponível: ${percentualDisponivel.toFixed(1)}% (${formatarMoeda(disponivelNoCartao)})">
                    <div class="progress-bar-filled" style="width: ${Math.min(percentualDisponivel, 100)}%; background-color: ${corDaBarra};">
                        ${textoNaBarra}
                    </div>
                </div>
            `;
            disponivelPorCartaoContainerEl.appendChild(cartaoDiv);
        });
    
        // Atualiza o total disponível global
        if (totalDisponivelCartoesEl) {
            totalDisponivelCartoesEl.textContent = formatarMoeda(somaTotalDisponivelGlobal);
        }
    }
    // Event Listeners
    if (aplicarFiltroBtn) {
        aplicarFiltroBtn.addEventListener('click', carregarDadosDashboard);
    }

    // Inicialização
    if (document.getElementById('filtros-section')) { // Garante que a seção de filtros existe
        popularFiltros();
    } else {
        console.warn("Seção de filtros não encontrada. Filtros não serão populados.");
    }

    if (typeof database !== 'undefined') {
        carregarDadosDashboard();
    } else {
        console.warn("Database do Firebase não definida na inicialização do dashboard.js.");
        if (totalGastoMesEl) totalGastoMesEl.textContent = 'Erro de Configuração';
    }
});