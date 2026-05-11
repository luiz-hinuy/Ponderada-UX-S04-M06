// ============================================================
//  ANÁLISE DE DECISÃO DE CRÉDITO — Infográfico Interativo p5.js
//  Mostra: importância dos parâmetros + perfil dos aprovados
// ============================================================

let W, H;
let section = 0;
let animT = 0;
let hoveredBar = -1;
let particles = [];
let expandedRow = -1; // linha expandida no painel de sensibilidade

// ── Dados da decisão ─────────────────────────────────────────
const decision = {
  approved: true,
  creditLimit: 12500,
  score: 742,
  risk: "BAIXO",
  riskColor: [0, 230, 150],
};

// Parâmetros com explicações e impactos direcionais
const params = [
  {
    name: "Score de Crédito",
    weight: 0.34, value: "742", unit: "pts", color: [0, 210, 255],
    explain: "Pontuação histórica de comportamento de crédito (escala 0–1000)",
    upEffect:   "Score sobe → limite aprovado aumenta / risco cai",
    downEffect: "Score abaixo de 650 → risco alto, possível negação",
  },
  {
    name: "Renda Mensal",
    weight: 0.22, value: "R$4.800", unit: "", color: [100, 180, 255],
    explain: "Renda declarada — base para calcular capacidade de pagamento",
    upEffect:   "Renda sobe → limite proporcional à renda cresce",
    downEffect: "Renda menor → limite reduzido ou crédito negado",
  },
  {
    name: "Tempo de Emprego",
    weight: 0.17, value: "3.2", unit: "anos", color: [180, 130, 255],
    explain: "Estabilidade no emprego atual — indica previsibilidade de renda",
    upEffect:   "Mais tempo → reduz risco percebido pelo modelo",
    downEffect: "Menos de 1 ano → penalização, fator de instabilidade",
  },
  {
    name: "Razão Dívida/Renda",
    weight: 0.13, value: "0.28", unit: "", color: [255, 190, 80],
    explain: "Fração da renda já comprometida com dívidas (ideal: < 0.35)",
    upEffect:   "Razão sobe → modelo reduz limite, risco de inadimplência maior",
    downEffect: "Razão menor → mais margem disponível, limite tende a subir",
  },
  {
    name: "Histórico de Pagamentos",
    weight: 0.09, value: "94%", unit: "", color: [80, 220, 180],
    explain: "% de parcelas pagas no prazo nos últimos 24 meses",
    upEffect:   "100% → sinal forte de confiabilidade",
    downEffect: "Abaixo de 80% → penalização significativa no resultado",
  },
  {
    name: "Nº de Dependentes",
    weight: 0.05, value: "1", unit: "dep.", color: [255, 140, 140],
    explain: "Número de pessoas financeiramente dependentes do solicitante",
    upEffect:   "Mais dependentes → reduz levemente a margem disponível",
    downEffect: "Nenhum dependente → impacto pequeno, mas ligeiramente positivo",
  },
];

// Clientes históricos da base (NÃO inclui o cliente atual)
const similarClients = [
  { score: 710, income: 4200, debtRatio: 0.31, approved: true,  limit: 10500 },
  { score: 760, income: 5100, debtRatio: 0.25, approved: true,  limit: 13200 },
  { score: 698, income: 3900, debtRatio: 0.35, approved: false, limit: 0     },
  { score: 780, income: 5500, debtRatio: 0.20, approved: true,  limit: 14800 },
  { score: 720, income: 4400, debtRatio: 0.30, approved: true,  limit: 11000 },
  { score: 650, income: 3500, debtRatio: 0.42, approved: false, limit: 0     },
  { score: 755, income: 4900, debtRatio: 0.26, approved: true,  limit: 13000 },
  { score: 670, income: 3700, debtRatio: 0.38, approved: false, limit: 0     },
  { score: 740, income: 4600, debtRatio: 0.29, approved: true,  limit: 11800 },
  { score: 795, income: 5800, debtRatio: 0.18, approved: true,  limit: 15200 },
  { score: 688, income: 3600, debtRatio: 0.40, approved: false, limit: 0     },
  { score: 730, income: 4300, debtRatio: 0.33, approved: true,  limit: 10200 },
];

let tabs = [];

// ── Setup ─────────────────────────────────────────────────────
function setup() {
  W = min(windowWidth, 900);
  H = min(windowHeight, 660);
  createCanvas(W, H);
  textFont("monospace");

  tabs = [
    { label: "DECISÃO",       x: 0,       w: W / 3 },
    { label: "SENSIBILIDADE", x: W / 3,   w: W / 3 },
    { label: "PERFIL",        x: 2*W/3,   w: W / 3 },
  ];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: random(W), y: random(H),
      vx: random(-0.3, 0.3), vy: random(-0.15, -0.05),
      size: random(1, 3), alpha: random(40, 120),
    });
  }
}

// ── Draw ──────────────────────────────────────────────────────
function draw() {
  background(13, 13, 20);
  animT += 0.02;

  drawParticles();
  drawHeader();
  drawTabs();

  let contentY = 110;
  if (section === 0) drawDecisionPanel(contentY);
  if (section === 1) drawSensitivityPanel(contentY);
  if (section === 2) drawProfilePanel(contentY);

  drawFooter();
}

// ── Partículas ────────────────────────────────────────────────
function drawParticles() {
  noStroke();
  for (let p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (p.y < 0) p.y = H;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    fill(80, 160, 255, p.alpha * (0.5 + 0.5 * sin(animT + p.x)));
    ellipse(p.x, p.y, p.size);
  }
}

// ── Header ────────────────────────────────────────────────────
function drawHeader() {
  stroke(40, 40, 70);
  strokeWeight(1);
  line(0, 44, W, 44);

  noStroke();
  fill(180, 180, 220);
  textSize(10);
  textAlign(LEFT, CENTER);
  text("SISTEMA DE CRÉDITO  //  ANÁLISE DE DECISÃO", 20, 22);

  let bx = W - 120;
  let [r, g, b] = decision.riskColor;
  fill(r, g, b, 30);
  stroke(r, g, b, 120);
  strokeWeight(1);
  rect(bx, 12, 100, 20, 4);
  noStroke();
  fill(r, g, b);
  textSize(9);
  textAlign(CENTER, CENTER);
  text(`RISCO ${decision.risk}`, bx + 50, 22);
}

// ── Tabs ──────────────────────────────────────────────────────
function drawTabs() {
  for (let i = 0; i < tabs.length; i++) {
    let t = tabs[i];
    let active = section === i;
    let hovered = mouseX > t.x && mouseX < t.x + t.w && mouseY > 48 && mouseY < 80;

    if (active) {
      fill(20, 20, 40); stroke(0, 180, 255, 180);
    } else if (hovered) {
      fill(20, 20, 35); stroke(60, 60, 100);
    } else {
      fill(13, 13, 20); stroke(30, 30, 55);
    }
    strokeWeight(1);
    rect(t.x, 48, t.w, 34);

    if (active) {
      let uw = t.w * 0.6;
      let ux = t.x + t.w / 2 - uw / 2;
      stroke(0, 180, 255); strokeWeight(2);
      line(ux, 82, ux + uw, 82);
    }

    noStroke();
    fill(active ? color(0, 200, 255) : color(120, 120, 160));
    textSize(9);
    textAlign(CENTER, CENTER);
    text(t.label, t.x + t.w / 2, 65);
  }
}

// ── PAINEL 0: Decisão ─────────────────────────────────────────
function drawDecisionPanel(y) {
  let cx = W / 2;
  let ringY = y + 130;
  let scoreNorm = map(decision.score, 300, 850, 0, 1);
  let sweepAngle = TWO_PI * scoreNorm;
  let [r, g, b] = decision.riskColor;

  stroke(30, 30, 50); strokeWeight(14); noFill();
  arc(cx, ringY, 170, 170, -HALF_PI, -HALF_PI + TWO_PI);

  let drawn = min(animT * 0.8, sweepAngle);
  stroke(r, g, b); strokeWeight(14);
  arc(cx, ringY, 170, 170, -HALF_PI, -HALF_PI + drawn);
  stroke(r, g, b, 40); strokeWeight(22);
  arc(cx, ringY, 170, 170, -HALF_PI, -HALF_PI + drawn);

  noStroke();
  fill(255); textSize(38); textAlign(CENTER, CENTER);
  text(decision.score, cx, ringY - 12);
  fill(r, g, b); textSize(10);
  text("SCORE", cx, ringY + 20);

  fill(255, 255, 255, 200); textSize(12);
  text("LIMITE APROVADO", cx, ringY + 55);
  fill(r, g, b); textSize(28);
  text(`R$ ${decision.creditLimit.toLocaleString("pt-BR")}`, cx, ringY + 82);

  let metrics = [
    { label: "SCORE",  val: decision.score + " pts",                          side: -1 },
    { label: "RISCO",  val: decision.risk,                                    side: -1 },
    { label: "LIMITE", val: "R$ " + (decision.creditLimit/1000).toFixed(1)+"k", side: 1 },
    { label: "STATUS", val: decision.approved ? "APROVADO" : "NEGADO",        side: 1 },
  ];

  for (let i = 0; i < metrics.length; i++) {
    let m = metrics[i];
    let myCorrected = ringY - 30 + i * 40;
    fill(20, 20, 40); stroke(40, 40, 70); strokeWeight(1);
    rect(m.side === -1 ? cx - 230 : cx + 120, myCorrected - 18, 100, 36, 4);
    noStroke();
    fill(100, 100, 140); textSize(8); textAlign(CENTER, CENTER);
    text(m.label, m.side === -1 ? cx - 180 : cx + 170, myCorrected - 6);
    fill(m.label === "STATUS" ? color(r, g, b) : 255); textSize(13);
    text(m.val, m.side === -1 ? cx - 180 : cx + 170, myCorrected + 10);
  }

  fill(80, 80, 120); textSize(9); textAlign(CENTER, BOTTOM);
  text("← clique nas abas para explorar a análise →", cx, H - 50);
}

// ── PAINEL 1: Sensibilidade ───────────────────────────────────
function drawSensitivityPanel(y) {
  let padL = 50, padR = 40;
  let barArea = W - padL - padR;
  let rowH = 46;

  // Cabeçalho explicativo
  noStroke();
  fill(0, 180, 255); textSize(10); textAlign(LEFT, TOP);
  text("IMPORTÂNCIA DOS PARÂMETROS NA DECISÃO", padL, y);

  fill(160, 160, 200); textSize(8);
  text("O percentual indica o quanto cada parâmetro pesou para chegar ao resultado acima.", padL, y + 14);
  fill(80, 80, 120); textSize(8);
  text("Clique em um parâmetro para ver o que acontece se ele subir ou baixar.", padL, y + 26);

  for (let i = 0; i < params.length; i++) {
    let p = params[i];
    let expanded = expandedRow === i;
    let ry = y + 44 + i * rowH + (expanded ? 0 : 0);
    // Adjust y for previously expanded rows above
    for (let k = 0; k < i; k++) {
      if (expandedRow === k) ry += 36;
    }

    let [pr, pg, pb] = p.color;
    let rowBottom = expanded ? ry + rowH + 36 : ry + rowH;
    let hovered = mouseX > padL && mouseX < W - padR &&
                  mouseY > ry && mouseY < rowBottom - 4;

    // linha de fundo ao hover
    if (hovered || expanded) {
      fill(pr, pg, pb, 8); noStroke();
      rect(padL - 8, ry, barArea + 16, expanded ? rowH + 36 : rowH - 4, 3);
    }

    // label + explicação
    fill(hovered || expanded ? 255 : 180); textSize(9); textAlign(LEFT, CENTER);
    text(p.name, padL, ry + 10);

    // explicação inline em cinza
    fill(100, 100, 140); textSize(7.5); textAlign(LEFT, CENTER);
    text(p.explain, padL, ry + 22);

    // valor do parâmetro
    fill(pr, pg, pb); textSize(9); textAlign(RIGHT, CENTER);
    text(`${p.value} ${p.unit}`, W - padR, ry + 10);

    // porcentagem grande
    fill(pr, pg, pb, 180); textSize(8); textAlign(RIGHT, CENTER);
    text(`${(p.weight * 100).toFixed(0)}% do peso`, W - padR, ry + 24);

    // trilha
    fill(25, 25, 45); noStroke();
    rect(padL, ry + 30, barArea, 9, 3);

    // barra animada
    let targetW = barArea * p.weight;
    let drawnW = max(0, min(animT * 60 - i * 20, targetW));
    fill(pr, pg, pb, hovered || expanded ? 220 : 160);
    rect(padL, ry + 30, drawnW, 9, 3);

    // detalhe expandido ao clicar
    if (expanded) {
      let ey = ry + rowH + 2;
      // painel de impacto
      fill(18, 18, 38); stroke(pr, pg, pb, 80); strokeWeight(1);
      rect(padL, ey, barArea, 30, 3);
      noStroke();

      // ↑ impacto
      fill(0, 220, 130); textSize(8); textAlign(LEFT, CENTER);
      text("▲  " + p.upEffect, padL + 8, ey + 9);

      // ↓ impacto
      fill(255, 100, 100); textSize(8); textAlign(LEFT, CENTER);
      text("▼  " + p.downEffect, padL + 8, ey + 22);
    }
  }
}

// ── PAINEL 2: Perfil dos Clientes Históricos ──────────────────
function drawProfilePanel(y) {
  noStroke();
  fill(0, 180, 255); textSize(10); textAlign(LEFT, TOP);
  text("BASE HISTÓRICA DE CLIENTES  //  SCORE × RENDA MENSAL", 40, y);

  fill(160, 160, 200); textSize(8);
  text("Cada ponto é um cliente histórico. Clientes com perfil semelhante ao atual tendem a se agrupar na mesma região.", 40, y + 13);
  fill(80, 80, 120); textSize(8);
  text("Tamanho do ponto = limite concedido.  Verde = aprovado.  Vermelho = negado.  Passe o mouse para ver detalhes.", 40, y + 24);

  let plotX = 80, plotY = y + 42;
  let plotW = W - 160;
  let plotH = H - plotY - 80;

  let scoreMin = 620, scoreMax = 820;
  let incomeMin = 3000, incomeMax = 6500;

  // fundo
  fill(15, 15, 30); stroke(30, 30, 55); strokeWeight(1);
  rect(plotX, plotY, plotW, plotH, 4);

  // grid + tick labels
  stroke(28, 28, 50); strokeWeight(1);
  let scoreSteps = [640, 680, 720, 760, 800];
  for (let sv of scoreSteps) {
    let gx = map(sv, scoreMin, scoreMax, plotX, plotX + plotW);
    line(gx, plotY, gx, plotY + plotH);
    noStroke(); fill(55, 55, 90); textSize(7); textAlign(CENTER, TOP);
    text(sv, gx, plotY + plotH + 4);
    stroke(28, 28, 50);
  }
  let incomeSteps = [3500, 4000, 4500, 5000, 5500, 6000];
  for (let iv of incomeSteps) {
    let gy = map(iv, incomeMin, incomeMax, plotY + plotH, plotY);
    line(plotX, gy, plotX + plotW, gy);
    noStroke(); fill(55, 55, 90); textSize(7); textAlign(RIGHT, CENTER);
    text("R$" + (iv/1000).toFixed(1)+"k", plotX - 4, gy);
    stroke(28, 28, 50);
  }

  // eixos
  stroke(40, 40, 70); strokeWeight(1);
  line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);
  line(plotX, plotY, plotX, plotY + plotH);

  // labels eixos
  noStroke(); fill(90, 90, 130); textSize(8);
  textAlign(CENTER, TOP);
  text("SCORE DE CRÉDITO →", plotX + plotW / 2, plotY + plotH + 16);
  push();
  translate(plotX - 42, plotY + plotH / 2);
  rotate(-HALF_PI); textAlign(CENTER, CENTER);
  text("RENDA MENSAL →", 0, 0);
  pop();

  // zona de aprovação aproximada
  let zoneX1 = map(700, scoreMin, scoreMax, plotX, plotX + plotW);
  let zoneY1 = map(3800, incomeMin, incomeMax, plotY + plotH, plotY);
  fill(0, 200, 120, 12); noStroke();
  rect(zoneX1, plotY + 4, plotX + plotW - zoneX1, zoneY1 - plotY - 4, 3);
  fill(0, 200, 120, 50); textSize(7.5); textAlign(LEFT, TOP);
  text("zona típica de aprovação", zoneX1 + 4, plotY + 6);

  // pontos
  let tooltipData = null;
  for (let i = 0; i < similarClients.length; i++) {
    let c = similarClients[i];
    let px = map(c.score, scoreMin, scoreMax, plotX + 10, plotX + plotW - 10);
    let py = map(c.income, incomeMin, incomeMax, plotY + plotH - 10, plotY + 10);
    let sz = c.approved ? map(c.limit, 8000, 16000, 12, 26) : 10;
    let hov = dist(mouseX, mouseY, px, py) < sz + 10;
    let [cr, cg, cb] = c.approved ? [0, 220, 140] : [255, 80, 80];

    if (hov) { fill(cr, cg, cb, 25); noStroke(); ellipse(px, py, sz * 3); }

    if (hov || !c.approved) {
      fill(cr, cg, cb, hov ? 220 : 130); noStroke();
    } else {
      fill(cr, cg, cb, 160); noStroke();
    }

    if (hov) { stroke(255, 255, 255, 100); strokeWeight(1); }
    else noStroke();
    ellipse(px, py, sz);

    if (hov) tooltipData = { c, px, py, cr, cg, cb, sz };
  }

  // tooltip por cima de tudo
  if (tooltipData) {
    let { c, px, py, cr, cg, cb, sz } = tooltipData;
    let tipW = 170, tipH = c.approved ? 74 : 60;
    let tx = px + sz + 6;
    let ty = py - tipH / 2;
    if (tx + tipW > plotX + plotW - 4) tx = px - tipW - sz - 6;
    if (ty < plotY + 4) ty = plotY + 4;
    if (ty + tipH > plotY + plotH - 4) ty = plotY + plotH - tipH - 4;

    fill(14, 14, 30, 245); stroke(cr, cg, cb, 180); strokeWeight(1);
    rect(tx, ty, tipW, tipH, 4);
    noStroke();

    fill(cr, cg, cb); textSize(8.5); textAlign(LEFT, TOP);
    text(c.approved ? "● APROVADO" : "● NEGADO", tx + 8, ty + 8);

    fill(200, 200, 220); textSize(8);
    text(`Score:  ${c.score} pts`, tx + 8, ty + 22);
    text(`Renda:  R$${c.income.toLocaleString("pt-BR")}`, tx + 8, ty + 33);
    text(`D/R:    ${c.debtRatio} (${c.debtRatio < 0.35 ? "dentro do ideal" : "acima do ideal"})`, tx + 8, ty + 44);
    if (c.approved) {
      fill(cr, cg, cb);
      text(`Limite: R$${c.limit.toLocaleString("pt-BR")}`, tx + 8, ty + 55);
      fill(100, 100, 140); textSize(7);
      text(`≈ ${(c.limit / c.income).toFixed(1)}x a renda mensal`, tx + 8, ty + 65);
    }
  }

  // legenda
  let lx = plotX + plotW - 148;
  fill(14, 14, 30, 220); stroke(30, 30, 55); strokeWeight(1);
  rect(lx - 6, plotY + 8, 150, 54, 4);
  noStroke();

  fill(0, 220, 140); ellipse(lx + 6, plotY + 22, 9);
  fill(180); textSize(8); textAlign(LEFT, CENTER);
  text("Aprovado — tamanho = limite", lx + 16, plotY + 22);

  fill(255, 80, 80); ellipse(lx + 6, plotY + 38, 9);
  fill(180);
  text("Negado — sem limite concedido", lx + 16, plotY + 38);

  fill(0, 200, 120, 40); rect(lx + 2, plotY + 50, 8, 8, 2);
  fill(0, 200, 120, 160); textSize(7.5);
  text("zona típica de aprovação", lx + 16, plotY + 54);
}

// ── Rodapé ────────────────────────────────────────────────────
function drawFooter() {
  stroke(30, 30, 55); strokeWeight(1);
  line(0, H - 28, W, H - 28);
  noStroke(); fill(50, 50, 80); textSize(8);
  textAlign(LEFT, CENTER);
  text("MODELO  //  RANDOM FOREST  //  CONCESSÃO DE CRÉDITO  //  v1.0", 20, H - 14);
  textAlign(RIGHT, CENTER);
  text("INTELI — UX CC06", W - 20, H - 14);
}

// ── Interação ─────────────────────────────────────────────────
function mousePressed() {
  // troca de aba
  for (let i = 0; i < tabs.length; i++) {
    let t = tabs[i];
    if (mouseX > t.x && mouseX < t.x + t.w && mouseY > 48 && mouseY < 82) {
      if (section !== i) { section = i; animT = 0; expandedRow = -1; }
      return;
    }
  }

  // expansão de linha na aba de sensibilidade
  if (section === 1) {
    let padL = 50, padR = 40;
    let barArea = W - padL - padR;
    let rowH = 46;
    let baseY = 110 + 44;

    for (let i = 0; i < params.length; i++) {
      let ry = baseY + i * rowH;
      for (let k = 0; k < i; k++) {
        if (expandedRow === k) ry += 36;
      }
      let rowBottom = expandedRow === i ? ry + rowH + 36 : ry + rowH;
      if (mouseX > padL - 8 && mouseX < W - padR + 8 &&
          mouseY > ry && mouseY < rowBottom - 4) {
        expandedRow = expandedRow === i ? -1 : i;
        return;
      }
    }
  }
}

function windowResized() {
  W = min(windowWidth, 900);
  H = min(windowHeight, 660);
  resizeCanvas(W, H);
  tabs[0].w = tabs[1].w = tabs[2].w = W / 3;
  tabs[1].x = W / 3;
  tabs[2].x = 2 * W / 3;
}