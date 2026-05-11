let W, H;
let section = 0;
let animT = 0;
let particles = [];
let expandedRow = -1;

const decision = {
  approved: true,
  creditLimit: 12500,
  risk: "BAIXO",
  riskColor: [0, 186, 255],
};

const params = [
  {
    name: "Prob. de Inadimplência",
    weight: 0.31, value: "12% estimado", color: [0, 186, 255],
    explain: "Probabilidade estimada de o solicitante não pagar a fatura",
    upEffect:   "Prob. cai → modelo tende a aprovar limites maiores",
    downEffect: "Prob. sobe → modelo reduz limite ou nega o crédito",
  },
  {
    name: "Renda Mensal",
    weight: 0.24, value: "R$ 4.800", color: [0, 155, 220],
    explain: "Renda declarada — base da capacidade de pagamento",
    upEffect:   "Renda sobe → limite proporcional cresce",
    downEffect: "Renda menor → limite reduzido ou negado",
  },
  {
    name: "Tempo de Emprego",
    weight: 0.18, value: "3,2 anos", color: [0, 210, 255],
    explain: "Estabilidade profissional — previsibilidade de renda",
    upEffect:   "Mais tempo → reduz risco percebido pelo modelo",
    downEffect: "Menos de 1 ano → fator de instabilidade",
  },
  {
    name: "Razão Dívida / Renda",
    weight: 0.14, value: "0,28  (ideal < 0,35)", color: [255, 200, 60],
    explain: "Fração da renda comprometida com dívidas",
    upEffect:   "Razão sobe → modelo penaliza com limite menor",
    downEffect: "Razão menor → mais margem, limite tende a subir",
  },
  {
    name: "Histórico de Pagamentos",
    weight: 0.09, value: "94% no prazo", color: [0, 230, 200],
    explain: "% de parcelas pagas no prazo nos últimos 24 meses",
    upEffect:   "100% → sinal forte de confiabilidade",
    downEffect: "Abaixo de 80% → penalização significativa",
  },
  {
    name: "Nº de Dependentes",
    weight: 0.04, value: "1 dependente", color: [255, 100, 130],
    explain: "Pessoas financeiramente dependentes do solicitante",
    upEffect:   "Mais dependentes → reduz a margem disponível",
    downEffect: "Nenhum → impacto pequeno, mas positivo",
  },
];

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

function setup() {
  W = windowWidth;
  H = windowHeight;
  createCanvas(W, H);
  textFont("monospace");
  tabs = [
    { label: "DECISÃO",       x: 0,       w: W / 3 },
    { label: "SENSIBILIDADE", x: W / 3,   w: W / 3 },
    { label: "PERFIL",        x: 2*W/3,   w: W / 3 },
  ];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: random(W), y: random(H),
      vx: random(-0.3, 0.3), vy: random(-0.15, -0.05),
      size: random(1, 3), alpha: random(30, 90),
    });
  }
}

function draw() {
  background(10, 20, 32);
  animT += 0.075;
  drawParticles();
  drawHeader();
  drawTabs();
  let contentY = 120;
  if (section === 0) drawDecisionPanel(contentY);
  if (section === 1) drawSensitivityPanel(contentY);
  if (section === 2) drawProfilePanel(contentY);
  drawFooter();
}

function drawParticles() {
  noStroke();
  for (let p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (p.y < 0) p.y = H;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    fill(0, 186, 255, p.alpha * (0.5 + 0.5 * sin(animT + p.x * 0.05)));
    ellipse(p.x, p.y, p.size);
  }
}

function drawHeader() {
  stroke(26, 52, 72); strokeWeight(1);
  line(0, 50, W, 50);
  noStroke();
  fill(180, 220, 240); textSize(13); textAlign(LEFT, CENTER);
  text("SISTEMA DE CRÉDITO  //  ANÁLISE DE DECISÃO", 24, 25);
  let [r, g, b] = decision.riskColor;
  let bx = W - 150;
  fill(r, g, b, 30); stroke(r, g, b, 120); strokeWeight(1);
  rect(bx, 12, 126, 26, 5);
  noStroke(); fill(r, g, b); textSize(12); textAlign(CENTER, CENTER);
  text(`RISCO ${decision.risk}`, bx + 63, 25);
}

function drawTabs() {
  for (let i = 0; i < tabs.length; i++) {
    let t = tabs[i];
    let active = section === i;
    let hov = mouseX > t.x && mouseX < t.x + t.w && mouseY > 54 && mouseY < 92;
    if (active)   { fill(10, 30, 50); stroke(0, 186, 255, 180); }
    else if (hov) { fill(14, 28, 44); stroke(40, 80, 110); }
    else          { fill(10, 20, 32); stroke(20, 44, 62); }
    strokeWeight(1); rect(t.x, 54, t.w, 38);
    if (active) {
      let uw = t.w * 0.5, ux = t.x + t.w / 2 - uw / 2;
      stroke(0, 186, 255); strokeWeight(2);
      line(ux, 92, ux + uw, 92);
    }
    noStroke();
    fill(active ? color(0, 186, 255) : color(120, 160, 180));
    textSize(12); textAlign(CENTER, CENTER);
    text(t.label, t.x + t.w / 2, 73);
  }
}

// painel de decisao
function drawDecisionPanel(y) {
  let [r, g, b] = decision.riskColor;
  let cx = W / 2;

  // área de conteúdo centralizada
  let cardW = min(W * 0.55, 520);
  let bx    = cx - cardW / 2;
  let by    = y + 30;

  // card status
  let [sr, sg, sb] = decision.approved ? [0, 186, 255] : [255, 77, 109];
  fill(sr, sg, sb, 18); stroke(sr, sg, sb, 100); strokeWeight(1);
  rect(bx, by, cardW, 72, 8);
  noStroke();
  fill(sr, sg, sb); textSize(15); textAlign(CENTER, CENTER);
  text(decision.approved ? "✔  CRÉDITO APROVADO" : "✖  CRÉDITO NEGADO", cx, by + 26);
  fill(255, 255, 255, 160); textSize(11);
  text("Decisão gerada pelo método Simplex", cx, by + 52);

  let ly = by + 88;
  fill(10, 28, 46); stroke(r, g, b, 100); strokeWeight(1);
  rect(bx, ly, cardW, 96, 8);
  noStroke();
  fill(140, 200, 230); textSize(12); textAlign(CENTER, TOP);
  text("LIMITE APROVADO", cx, ly + 14);
  fill(r, g, b); textSize(46); textAlign(CENTER, CENTER);
  text("R$ " + decision.creditLimit.toLocaleString("pt-BR"), cx, ly + 62);

  // cards de métricas secundárias
  let metrics = [
    { label: "RISCO",  val: decision.risk  },
    { label: "PRAZO",  val: "36 meses"     },
    { label: "TAXA",   val: "2,4% a.m."    },
    { label: "PARCELA",val: "R$ 347"       },
  ];
  let gap    = 8;
  let mCardW = (cardW - gap * (metrics.length - 1)) / metrics.length;
  let mY     = ly + 112;
  for (let i = 0; i < metrics.length; i++) {
    let mx = bx + i * (mCardW + gap);
    fill(12, 24, 40); stroke(24, 50, 70); strokeWeight(1);
    rect(mx, mY, mCardW, 64, 6);
    noStroke();
    fill(80, 140, 170); textSize(10); textAlign(CENTER, TOP);
    text(metrics[i].label, mx + mCardW / 2, mY + 10);
    fill(i === 0 ? color(r, g, b) : 225);
    textSize(14); textAlign(CENTER, CENTER);
    text(metrics[i].val, mx + mCardW / 2, mY + 40);
  }

  fill(50, 110, 150); textSize(11); textAlign(CENTER, BOTTOM);
  text("← use as abas acima para explorar a análise →", cx, H - 40);
}

// painel de sensibilidade
function drawSensitivityPanel(y) {
  let padL = 60, padR = 60;
  let barArea = W - padL - padR;
  let rowH = 56;

  noStroke();
  fill(0, 186, 255); textSize(14); textAlign(LEFT, TOP);
  text("VARIÁVEIS DO MODELO  //  IMPACTO NA DECISÃO", padL, y);
  fill(140, 200, 230); textSize(12);
  text("O % representa o peso de cada variável na resposta do modelo. Quanto maior, mais aquela variável determina se o crédito é aprovado ou negado.", padL, y + 20);

  for (let i = 0; i < params.length; i++) {
    let p = params[i];
    let expanded = expandedRow === i;
    let ry = y + 52 + i * rowH;
    for (let k = 0; k < i; k++) {
      if (expandedRow === k) ry += 48;
    }
    let [pr, pg, pb] = p.color;
    let rowBottom = expanded ? ry + rowH + 48 : ry + rowH;
    let hov = mouseX > padL - 10 && mouseX < W - padR + 10 &&
              mouseY > ry && mouseY < rowBottom - 2;

    if (hov || expanded) {
      fill(pr, pg, pb, 10); noStroke();
      rect(padL - 10, ry + 2, barArea + 20, expanded ? rowH + 46 : rowH - 4, 4);
    }

    fill(hov || expanded ? 255 : 190); textSize(13); textAlign(LEFT, TOP);
    text(p.name, padL, ry + 6);
    fill(90, 150, 180); textSize(11); textAlign(LEFT, TOP);
    text(p.explain, padL, ry + 24);

    fill(pr, pg, pb); textSize(13); textAlign(RIGHT, TOP);
    text(p.value, W - padR, ry + 6);
    fill(pr, pg, pb, 190); textSize(11); textAlign(RIGHT, TOP);
    text(`${(p.weight * 100).toFixed(0)}% de impacto`, W - padR, ry + 24);

    fill(15, 35, 55); noStroke();
    rect(padL, ry + 40, barArea, 11, 4);
    let targetW = barArea * p.weight;
    let drawnW  = max(0, min(animT * 70 - i * 22, targetW));
    fill(pr, pg, pb, hov || expanded ? 230 : 170);
    rect(padL, ry + 40, drawnW, 11, 4);

    if (expanded) {
      let ey = ry + rowH + 4;
      fill(16, 16, 36); stroke(pr, pg, pb, 70); strokeWeight(1);
      rect(padL, ey, barArea, 40, 4);
      noStroke();
      fill(0, 220, 130); textSize(12); textAlign(LEFT, CENTER);
      text("▲  " + p.upEffect,   padL + 12, ey + 13);
      fill(255, 90, 90); textSize(12);
      text("▼  " + p.downEffect, padL + 12, ey + 30);
    }
    if (hov && !expanded) {
      fill(pr, pg, pb, 120); textSize(10); textAlign(RIGHT, TOP);
      text("clique para ver impactos ↓", W - padR, ry + 40);
    }
  }
}

// painel de perfil
function drawProfilePanel(y) {
  noStroke();
  fill(0, 186, 255); textSize(14); textAlign(LEFT, TOP);
  text("BASE HISTÓRICA DE CLIENTES  //  SCORE × RENDA", 50, y);
  fill(140, 200, 230); textSize(11);
  text("Cada ponto representa um cliente da base histórica. Tamanho do ponto = limite concedido. Passe o mouse para detalhes.", 50, y + 20);

  let plotX = 90, plotY = y + 48;
  let plotW = W - 180, plotH = H - plotY - 70;
  let scoreMin = 620, scoreMax = 820;
  let incomeMin = 3000, incomeMax = 6500;

  fill(10, 22, 38); stroke(20, 46, 66); strokeWeight(1);
  rect(plotX, plotY, plotW, plotH, 6);

  stroke(18, 40, 60); strokeWeight(1);
  for (let sv of [640, 680, 720, 760, 800]) {
    let gx = map(sv, scoreMin, scoreMax, plotX, plotX + plotW);
    line(gx, plotY, gx, plotY + plotH);
    noStroke(); fill(50, 110, 150); textSize(11); textAlign(CENTER, TOP);
    text(sv, gx, plotY + plotH + 6);
    stroke(18, 40, 60);
  }
  for (let iv of [3500, 4000, 4500, 5000, 5500, 6000]) {
    let gy = map(iv, incomeMin, incomeMax, plotY + plotH, plotY);
    line(plotX, gy, plotX + plotW, gy);
    noStroke(); fill(50, 110, 150); textSize(11); textAlign(RIGHT, CENTER);
    text("R$" + (iv / 1000).toFixed(0) + "k", plotX - 6, gy);
    stroke(18, 40, 60);
  }

  stroke(30, 60, 90); strokeWeight(1);
  line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);
  line(plotX, plotY, plotX, plotY + plotH);

  noStroke(); fill(70, 140, 180); textSize(12);
  textAlign(CENTER, TOP);
  text("SCORE DE CRÉDITO →", plotX + plotW / 2, plotY + plotH + 22);
  push();
  translate(plotX - 56, plotY + plotH / 2);
  rotate(-HALF_PI); textAlign(CENTER, CENTER);
  text("RENDA MENSAL →", 0, 0);
  pop();

  let zoneX1 = map(700, scoreMin, scoreMax, plotX, plotX + plotW);
  let zoneY1 = map(3800, incomeMin, incomeMax, plotY + plotH, plotY);
  fill(0, 186, 255, 10); noStroke();
  rect(zoneX1, plotY + 4, plotX + plotW - zoneX1, zoneY1 - plotY - 4, 3);
  fill(0, 186, 255, 80); textSize(11); textAlign(LEFT, TOP);
  text("zona típica de aprovação", zoneX1 + 6, plotY + 8);

  let tooltipData = null;
  for (let c of similarClients) {
    let px = map(c.score,  scoreMin,  scoreMax,  plotX + 14, plotX + plotW - 14);
    let py = map(c.income, incomeMin, incomeMax, plotY + plotH - 14, plotY + 14);
    let sz = c.approved ? map(c.limit, 8000, 16000, 14, 30) : 12;
    let hov = dist(mouseX, mouseY, px, py) < sz + 12;
    let [cr, cg, cb] = c.approved ? [0, 186, 255] : [255, 77, 109];

    if (hov) { fill(cr, cg, cb, 20); noStroke(); ellipse(px, py, sz * 3.5); }
    noStroke();
    fill(cr, cg, cb, hov ? 230 : (c.approved ? 170 : 140));
    if (hov) { stroke(255, 255, 255, 80); strokeWeight(1); }
    ellipse(px, py, sz);
    noStroke();
    if (hov) tooltipData = { c, px, py, cr, cg, cb, sz };
  }

  if (tooltipData) {
    let { c, px, py, cr, cg, cb, sz } = tooltipData;
    let tipW = 200, tipH = c.approved ? 100 : 80;
    let tx = px + sz + 8;
    let ty = constrain(py - tipH / 2, plotY + 4, plotY + plotH - tipH - 4);
    if (tx + tipW > plotX + plotW - 4) tx = px - tipW - sz - 8;

    fill(8, 22, 40, 252); stroke(cr, cg, cb, 200); strokeWeight(1);
    rect(tx, ty, tipW, tipH, 5);
    noStroke();
    fill(cr, cg, cb); textSize(12); textAlign(LEFT, TOP);
    text(c.approved ? "● APROVADO" : "● NEGADO", tx + 10, ty + 10);
    fill(180, 220, 240); textSize(11);
    text(`Score:  ${c.score} pts`,                         tx + 10, ty + 28);
    text(`Renda:  R$ ${c.income.toLocaleString("pt-BR")}`, tx + 10, ty + 42);
    text(`D/R:    ${c.debtRatio}  ${c.debtRatio < 0.35 ? "(dentro do ideal)" : "(acima do ideal)"}`, tx + 10, ty + 56);
    if (c.approved) {
      fill(cr, cg, cb); textSize(12);
      text(`Limite: R$ ${c.limit.toLocaleString("pt-BR")}`, tx + 10, ty + 72);
      fill(70, 140, 180); textSize(10);
      text(`≈ ${(c.limit / c.income).toFixed(1)}× a renda mensal`, tx + 10, ty + 88);
    }
  }

  let lx = plotX + plotW - 220;
  fill(8, 22, 40, 220); stroke(20, 46, 66); strokeWeight(1);
  rect(lx - 8, plotY + 10, 224, 68, 5);
  noStroke();
  fill(0, 186, 255);  ellipse(lx + 8, plotY + 28, 12);
  fill(190); textSize(11); textAlign(LEFT, CENTER);
  text("Aprovado  —  tamanho = limite", lx + 20, plotY + 28);
  fill(255, 77, 109);  ellipse(lx + 8, plotY + 50, 12);
  fill(190);
  text("Negado  —  sem limite concedido", lx + 20, plotY + 50);
  fill(0, 186, 255, 30); rect(lx + 3, plotY + 62, 10, 10, 2);
  fill(0, 186, 255, 180); textSize(10);
  text("zona típica de aprovação", lx + 20, plotY + 67);
}

function drawFooter() {
  stroke(20, 46, 66); strokeWeight(1);
  line(0, H - 32, W, H - 32);
  noStroke(); fill(60, 120, 160); textSize(11);
  textAlign(LEFT, CENTER);
  text("MODELO  //  SIMPLEX  //  CONCESSÃO DE CRÉDITO  //  v1.0", 24, H - 16);
  textAlign(RIGHT, CENTER);
  text("INTELI — UX CC06", W - 24, H - 16);
}

function mousePressed() {
  for (let i = 0; i < tabs.length; i++) {
    let t = tabs[i];
    if (mouseX > t.x && mouseX < t.x + t.w && mouseY > 54 && mouseY < 92) {
      if (section !== i) { section = i; animT = 0; expandedRow = -1; }
      return;
    }
  }
  if (section === 1) {
    let padL = 60, padR = 60;
    let rowH = 56, baseY = 120 + 52;
    for (let i = 0; i < params.length; i++) {
      let ry = baseY + i * rowH;
      for (let k = 0; k < i; k++) { if (expandedRow === k) ry += 48; }
      let rowBottom = expandedRow === i ? ry + rowH + 48 : ry + rowH;
      if (mouseX > padL - 10 && mouseX < W - padR + 10 &&
          mouseY > ry && mouseY < rowBottom - 2) {
        expandedRow = (expandedRow === i) ? -1 : i;
        return;
      }
    }
  }
}

function windowResized() {
  W = windowWidth; H = windowHeight;
  resizeCanvas(W, H);
  tabs[0].w = tabs[1].w = tabs[2].w = W / 3;
  tabs[1].x = W / 3; tabs[2].x = 2 * W / 3;
  for (let p of particles) { p.x = random(W); p.y = random(H); }
}