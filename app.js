// @author piercer
(() => {
  const KEY = "piercer_crypto_studio_v1";
  const $ = (id) => document.getElementById(id);

  let prices = {
    bitcoin: { usd: 95000, brl: 545000, sym: "BTC" },
    ethereum: { usd: 3300, brl: 19000, sym: "ETH" },
    solana: { usd: 210, brl: 1200, sym: "SOL" },
    binancecoin: { usd: 640, brl: 3680, sym: "BNB" },
    ripple: { usd: 1.4, brl: 8.0, sym: "XRP" },
  };

  let state = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      return {
        buys: Array.isArray(s.buys) ? s.buys : [{ qty: 0.02, price: 68000 }, { qty: 0.03, price: 82000 }],
        vendasMesBrl: s.vendasMesBrl ?? 22000,
        lucroMesBrl: s.lucroMesBrl ?? 4500,
      };
    } catch { return { buys: [], vendasMesBrl: 22000, lucroMesBrl: 4500 }; }
  })();

  $("vendasMesBrl").value = state.vendasMesBrl;
  $("lucroMesBrl").value = state.lucroMesBrl;

  function save() {
    state.vendasMesBrl = Number($("vendasMesBrl").value) || 0;
    state.lucroMesBrl = Number($("lucroMesBrl").value) || 0;
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function renderTickers() {
    $("tickerBar").innerHTML = Object.entries(prices)
      .map(([, p]) => `<div class="ticker-card"><div class="subtitle">${p.sym}</div><strong>$${p.usd.toLocaleString("en-US")}</strong><div class="subtitle">R$ ${p.brl.toLocaleString("pt-BR")}</div></div>`)
      .join("");
  }

  function renderCalcs() {
    save();
    const coin = prices[$("coinSelect").value] || prices.bitcoin;
    const qty = Math.max(0, Number($("convQty").value) || 0);
    $("convOut").textContent = `USD: $${(qty * coin.usd).toLocaleString("en-US", { maximumFractionDigits: 2 })} • BRL: R$ ${(qty * coin.brl).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;

    const entry = Math.max(0.0001, Number($("entryPrice").value) || 1);
    const exit = Math.max(0, Number($("exitPrice").value) || 0);
    const cap = Math.max(0, Number($("capitalUsd").value) || 0);
    const fee = Math.max(0, Number($("feePct").value) || 0) / 100;
    const gross = cap * ((exit - entry) / entry);
    const net = gross - cap * fee;
    const pct = cap > 0 ? (net / cap) * 100 : 0;
    $("pnlOut").textContent = `Lucro Líquido: $${net.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`;

    const totQty = state.buys.reduce((s, b) => s + b.qty, 0);
    const totCost = state.buys.reduce((s, b) => s + b.qty * b.price, 0);
    const avg = totQty > 0 ? totCost / totQty : 0;
    $("dcaSummary").textContent = `Qtd Total: ${totQty.toFixed(5)} • Preço Médio: $${avg.toFixed(2)} • Custo: $${totCost.toFixed(2)}`;

    $("dcaList").innerHTML = "";
    state.buys.forEach((b, i) => {
      const row = document.createElement("div");
      row.className = "dca-row";
      row.innerHTML = `<span>${b.qty} × $${b.price}</span><button type="button" class="btn">×</button>`;
      row.querySelector("button").addEventListener("click", () => {
        state.buys.splice(i, 1);
        renderCalcs();
      });
      $("dcaList").appendChild(row);
    });

    const vendas = state.vendasMesBrl;
    const lucro = state.lucroMesBrl;
    $("taxOut").textContent = vendas <= 35000
      ? "Isento de IR no Brasil (vendas ≤ R$ 35.000,00 no mês)"
      : `DARF Cripto (15% sobre lucro): R$ ${(lucro * 0.15).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async function fetchLivePrices() {
    try {
      const ids = Object.keys(prices).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,brl`);
      const data = await res.json();
      for (const id of Object.keys(prices)) {
        if (data[id]) {
          prices[id].usd = data[id].usd;
          prices[id].brl = data[id].brl;
        }
      }
      renderTickers();
      renderCalcs();
    } catch {
      renderTickers();
    }
  }

  $("dcaForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.buys.push({ qty: Number($("dcaQty").value) || 0, price: Number($("dcaPrice").value) || 0 });
    $("dcaQty").value = "";
    $("dcaPrice").value = "";
    renderCalcs();
  });

  ["coinSelect", "convQty", "entryPrice", "exitPrice", "capitalUsd", "feePct", "vendasMesBrl", "lucroMesBrl"].forEach((id) => {
    $(id).addEventListener("input", renderCalcs);
  });
  $("btnFetchPrices").addEventListener("click", fetchLivePrices);

  renderTickers();
  renderCalcs();
  fetchLivePrices();
})();
