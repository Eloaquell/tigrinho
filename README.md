# Tigrinho da Sorte

Simulador demonstrativo de caça-níquel em React, com visual de cassino e valores **fictícios formatados em reais (R$)**.

> **Importante:** R$ é apenas a formatação visual de créditos simulados. Este projeto não aceita depósitos, não processa apostas com dinheiro real, não realiza saques e não representa uma atividade financeira ou promessa de ganhos.

## Recursos

- Grade de símbolos 3×3 e cinco linhas de pagamento.
- Tigre como símbolo curinga e recurso especial Tigre Furioso.
- Rodadas bônus com giros grátis e multiplicador crescente.
- Valores de aposta e saldo simulados exibidos em R$.
- Ritmo de animação mais rápido, com modo turbo.
- Frequência de combinações vencedoras reduzida em relação à configuração anterior.
- Estatísticas da sessão e histórico das últimas rodadas.
- Preferências e saldo de demonstração salvos localmente.
- Efeitos sonoros opcionais, lembretes de pausa e simulador estatístico.

## Tecnologias

- React
- Vite
- JavaScript
- CSS
- Web Audio API e Web Crypto API do navegador

## Executar localmente

Requer Node.js compatível com a versão do Vite instalada.

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Probabilidades

Os pesos dos símbolos foram alterados para tornar as combinações vencedoras menos frequentes. Isso não representa uma probabilidade calibrada de cassino. O RTP é indicado como **não calibrado**; os resultados do simulador são amostras variáveis, não garantias nem previsões.

## Estrutura principal

- `src/App.jsx`: lógica e interface do jogo.
- `src/index.css`: estilos globais.
- `index.html`: documento inicial da aplicação.
