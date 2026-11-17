# Tigrinho da Sorte

Jogo demonstrativo de caça-níquel em React, com tema de tigre e **moedas exclusivamente virtuais**.

> **Aviso:** este projeto é apenas para entretenimento e demonstração. Não aceita depósitos, não realiza pagamentos e não permite converter moedas virtuais em dinheiro real. Não há promessa de ganhos.

## Recursos

- Grade de símbolos 3×3 e cinco linhas de pagamento.
- Tigre como símbolo curinga e recurso especial Tigre Furioso.
- Rodadas bônus com giros grátis e multiplicador crescente.
- Apostas virtuais ajustáveis, modo turbo e giros automáticos.
- Saldo, estatísticas da sessão e histórico das últimas rodadas.
- Preferências e saldo salvos localmente no navegador.
- Efeitos sonoros opcionais e lembretes de pausa.
- Simulador estatístico para observar o comportamento das rodadas.

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

## Observações sobre probabilidades

O jogo usa sorteio criptograficamente seguro do navegador para selecionar os resultados. O RTP exibido nas regras é **apenas uma referência informativa de 96%**, não uma garantia nem um valor matematicamente calibrado. O simulador apresenta resultados observados em uma amostra e pode variar a cada execução.

## Estrutura principal

- `src/App.jsx`: lógica e interface do jogo.
- `src/index.css`: estilos globais.
- `index.html`: documento inicial da aplicação.
