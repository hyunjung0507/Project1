'use strict';

/* ============================================================
   제품 데이터
   ============================================================ */
const MODEL_GROUPS = {
  A: { label: '정속형 / 인버터', models: ['PWA-2100','PWA-2200','PWA-2250','PWA-3200','PWA-3250'], youtubeGroup: 'AC', isPremium: false },
  B: { label: '프리미엄',        models: ['PWA-3400','PWA-3500','PWA-3600','PWA-3650','PWA-M3500','PWA-3301BE2'], youtubeGroup: 'BD', isPremium: true },
  C: { label: '듀얼인버터',      models: ['PWA-3100','PWA-3300','PWA-3300BE'], youtubeGroup: 'AC', isPremium: false },
  D: { label: '하이브리드',      models: ['PHA-M3240BE','PHA-M3600BE2'], youtubeGroup: 'BD', isPremium: true }
};

/* ─── 유튜브 영상 풀 목록 ─── */
const YOUTUBE_VIDEOS = {
  AC: {
    basic: { label: '🎬 일반 설치 영상',          url: 'https://www.youtube.com/watch?v=QY1geCxHO3Q' },
    thick: { label: '🎬 두꺼운 창틀 설치',        url: 'https://www.youtube.com/watch?v=DQyIik9sZ4w' },
    kit:   { label: '🎬 추가키트 설치법',          url: 'https://www.youtube.com/watch?v=MFG_7RdLFaE' },
    wood:  { label: '🎬 나무 창틀 설치',          url: 'https://www.youtube.com/watch?v=re__v4lfV8A'  },
    all:   { label: '📺 모든 창틀 통합 가이드',   url: 'https://www.youtube.com/watch?v=BBqEtUb5Occ' }
  },
  BD: {
    basic: { label: '🎬 일반 설치 영상',          url: 'https://youtu.be/iWDHJ82y7U4'               },
    kit:   { label: '🎬 추가키트 설치법',          url: 'https://youtu.be/BqgmeJjWYcg'               },
    wood:  { label: '🎬 나무 창틀 설치',          url: 'https://www.youtube.com/watch?v=I8R860SVuIo' },
    all:   { label: '📺 모든 창틀 통합 가이드',   url: 'https://www.youtube.com/watch?v=oaVrZpyJ3jc' }
  }
};

const KIT_INFO = {
  dual_inverter: {
    name: '듀얼인버터 추가 키트',
    models: ['PWA-2200','PWA-2250','PWA-3200','PWA-3250','PWA-3300','PWA-M3100'],
    desc: '일반·미니 제품에 사용 가능한 듀얼인버터 추가 키트입니다.'
  },
  premium: {
    name: '프리미엄 추가 키트',
    models: ['PWA-3400','PWA-3500','PWA-3600','PWA-3650','PWA-M3500'],
    desc: '프리미엄 제품 전용 추가 키트입니다.'
  }
};

const HEIGHT_RANGES = {
  standard: [
    { id:'base', label:'92cm ~ 148cm 미만',  desc:'추가 키트 불필요', needKit:false, icon:'fa-check-circle' },
    { id:'kit',  label:'148cm 이상',          desc:'추가 키트 필요',   needKit:true,  icon:'fa-plus-circle'  }
  ],
  mini: [
    { id:'base', label:'77cm ~ 132cm 미만',  desc:'추가 키트 불필요', needKit:false, icon:'fa-check-circle' },
    { id:'kit',  label:'132cm 이상',          desc:'추가 키트 필요',   needKit:true,  icon:'fa-plus-circle'  }
  ]
};

const INSTALL_CRITERIA = {
  minWidth: 38,
  minHeightStandard: 92,
  minHeightMini: 77,
  minSillB: 1, maxSillB: 2,
  minSillC: 1.2
};

/* ============================================================
   앱 상태
   ============================================================ */
const state = {
  currentScreen: 'screen-0',
  screenHistory: [],
  modelGroup:   null,   // 'A'|'B'|'C'|'D'
  windowType:   null,   // 'sliding'|'casement'
  windowWidth:  null,
  windowHeight: null,
  productType:  null,   // 'standard'|'mini'
  heightRange:  null,   // 'base'|'kit'
  sillDepth:    null,   // 'shallow'|'deep'
  sillB: null, sillC: null,
  sillBCValid:  false,
  envType:      null,   // 'plastic'|'thick'|'wood'|'split'
  frameA:       null    // 두꺼운 창틀 너비 a
};

const STEP_FLOW = ['screen-0','screen-model','screen-1','screen-2','screen-3','screen-4','screen-5','screen-6'];

/* ============================================================
   편의 함수: 현재 모델이 프리미엄/하이브리드인지
   ============================================================ */
function isPremiumModel() {
  return state.modelGroup === 'B' || state.modelGroup === 'D';
}

/* ============================================================
   유튜브 버튼 결정 로직 (v2 — 환경별 전용 영상 + 통합가이드 상시 노출)
   ─ 선택 환경에 맞는 영상을 무조건 포함하고,
     'all'(통합 가이드)은 항상 마지막에 추가한다.
   ============================================================ */
function resolveYoutubeKeys() {
  const s = state;
  const group = s.modelGroup ? MODEL_GROUPS[s.modelGroup].youtubeGroup : null;
  if (!group || s.windowType !== 'sliding') return [];

  const videos = YOUTUBE_VIDEOS[group];
  // 순서 보장을 위해 배열 사용 (중복 방지는 Set으로)
  const keySet = new Set();
  const keyArr = [];

  function addKey(k) {
    if (videos[k] && !keySet.has(k)) { keySet.add(k); keyArr.push(k); }
  }

  const env = s.envType || 'plastic';

  /* ── Step 2 명세에 따른 환경별 전용 영상 ── */
  if (env === 'wood')    { addKey('wood'); }   // 나무 창틀 → 나무 창틀 영상
  if (env === 'thick')   { addKey('thick'); }  // 두꺼운 창틀 → 두꺼운 창틀 영상 (BD엔 없으므로 자동 무시)
  if (env === 'split')   { addKey('kit'); }    // 분할창문 → 추가키트 영상
  if (env === 'plastic') { addKey('basic'); }  // 플라스틱 샷시 → 일반 설치 영상

  /* ── 추가키트 높이 조건 충족 시 kit 영상 추가 ── */
  const h = s.windowHeight || 0;
  const kitThresh = s.productType === 'mini' ? 132 : 148;
  if (s.productType && h >= kitThresh) { addKey('kit'); }

  /* ── 키가 하나도 없으면 기본 영상 fallback ── */
  if (keyArr.length === 0) { addKey('basic'); }

  /* ── 통합 가이드 (all) 항상 마지막에 추가 ── */
  addKey('all');

  return keyArr;
}

/* ============================================================
   App
   ============================================================ */
const App = {

  /* ─── 초기화 ─── */
  init() {
    this.showScreen('screen-0');
    console.log('창문형 에어컨 설치 안내 앱 초기화 완료');
  },

  startGuide() { this.goTo('screen-model'); },

  /* ─── 화면 전환 ─── */
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
    state.currentScreen = id;
    this.updateHeader();
    const main = document.getElementById('appMain');
    if (main) main.scrollTop = 0;
  },

  goTo(id) {
    state.screenHistory.push(state.currentScreen);
    this.showScreen(id);
  },

  nextStep() {
    const idx = STEP_FLOW.indexOf(state.currentScreen);
    if (idx >= 0 && idx < STEP_FLOW.length - 1) this.goTo(STEP_FLOW[idx + 1]);
  },

  prevStep() {
    if (state.screenHistory.length > 0) {
      const prev = state.screenHistory.pop();
      this.showScreen(prev);
    }
  },

  /* ─── 헤더 ─── */
  updateHeader() {
    const id = state.currentScreen;
    const btnBack      = document.getElementById('btnBack');
    const progressWrap = document.getElementById('progressBarWrap');
    const progressBar  = document.getElementById('progressBar');
    const indicator    = document.getElementById('stepIndicator');

    if (['screen-0','screen-casement-block'].includes(id)) {
      if (btnBack)      btnBack.style.display      = 'none';
      if (progressWrap) progressWrap.style.display = 'none';
      if (indicator)    indicator.textContent      = '';
      return;
    }
    if (btnBack)      btnBack.style.display      = 'flex';
    if (progressWrap) progressWrap.style.display = 'block';

    const steps   = ['screen-model','screen-1','screen-2','screen-3','screen-4','screen-5'];
    const stepIdx = steps.indexOf(id);
    const labels  = ['모델 선택','1단계','2단계','3단계','4단계','5단계'];

    if (id === 'screen-6') {
      if (progressBar) progressBar.style.width = '100%';
      if (indicator)   indicator.textContent   = '✅ 안내 완료';
    } else if (stepIdx >= 0) {
      if (progressBar) progressBar.style.width = `${((stepIdx+1)/steps.length)*100}%`;
      if (indicator)   indicator.textContent   = `${labels[stepIdx]} / 총 5단계`;
    } else {
      if (progressBar) progressBar.style.width = '0%';
      if (indicator)   indicator.textContent   = '';
    }
  },

  /* ============================================================
     모델 선택
     ============================================================ */
  selectModel(group) {
    state.modelGroup = group;
    document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`model-card-${group}`)?.classList.add('selected');
    const btn = document.getElementById('btn-model-next');
    if (btn) btn.disabled = false;
  },

  /* ============================================================
     STEP 1: 창문 유형
     ============================================================ */
  selectWindowType(type) {
    state.windowType = type;
    document.querySelectorAll('[id^="choice-window-"]').forEach(el => el.classList.remove('selected'));
    document.getElementById(`choice-window-${type === 'sliding' ? 'sliding' : 'casement'}`)?.classList.add('selected');

    const btn = document.getElementById('btn-step1-next');
    if (btn) {
      btn.disabled = false;
      if (type === 'casement') {
        btn.innerHTML = '계속하기 <i class="fas fa-chevron-right"></i>';
        btn.onclick   = () => App.handleCasement();
      } else {
        btn.innerHTML = '다음 <i class="fas fa-chevron-right"></i>';
        btn.onclick   = () => App.nextStep();
      }
    }
  },

  handleCasement() { this.goTo('screen-casement-block'); },

  /* ============================================================
     STEP 2: 창문 크기 검증
     ============================================================ */
  validateStep2() {
    const wEl = document.getElementById('windowWidth');
    const hEl = document.getElementById('windowHeight');
    const wHint = document.getElementById('widthHint');
    const hHint = document.getElementById('heightHint');
    const btn   = document.getElementById('btn-step2-next');
    const w = parseFloat(wEl?.value), h = parseFloat(hEl?.value);

    if (!isNaN(w) && w > 0) {
      const wrap = wEl.closest('.input-wrap');
      const ok = w >= INSTALL_CRITERIA.minWidth;
      wrap.classList.toggle('success', ok); wrap.classList.toggle('error', !ok);
      wHint.className = `input-hint ${ok?'success':'error'}`;
      wHint.textContent = ok ? `✓ ${w}cm - 가로 조건 충족` : `⚠ ${w}cm는 최소 38cm 기준 미달입니다.`;
      state.windowWidth = w;
    } else { state.windowWidth = null; }

    if (!isNaN(h) && h > 0) {
      const wrap = hEl.closest('.input-wrap');
      state.windowHeight = h;
      if (h < INSTALL_CRITERIA.minHeightMini) {
        wrap.classList.add('error'); wrap.classList.remove('success');
        hHint.className = 'input-hint error';
        hHint.textContent = `⚠ ${h}cm - 미니 제품 최소 기준(77cm)에도 미달`;
      } else if (h < INSTALL_CRITERIA.minHeightStandard) {
        wrap.classList.remove('error','success');
        hHint.className = 'input-hint';
        hHint.textContent = `ℹ ${h}cm - 미니 제품만 설치 가능`;
      } else {
        wrap.classList.add('success'); wrap.classList.remove('error');
        hHint.className = 'input-hint success';
        hHint.textContent = `✓ ${h}cm - 일반/미니 모두 설치 가능`;
      }
    } else { state.windowHeight = null; }

    if (btn) btn.disabled = !(state.windowWidth > 0 && state.windowHeight > 0);
  },

  /* ============================================================
     STEP 3: 제품 유형
     ============================================================ */
  selectProductType(type) {
    state.productType = type;
    state.heightRange = null;
    document.querySelectorAll('[id^="choice-product-"]').forEach(el => el.classList.remove('selected'));
    document.getElementById(`choice-product-${type}`)?.classList.add('selected');

    const section = document.getElementById('heightRangeSection');
    const cards   = document.getElementById('heightRangeCards');
    if (section && cards) {
      cards.innerHTML = HEIGHT_RANGES[type].map(r => `
        <button class="range-card" id="range-${r.id}" onclick="App.selectHeightRange('${r.id}',${r.needKit})">
          <div class="range-icon"><i class="fas ${r.icon}"></i></div>
          <div class="range-content">
            <div class="range-label">${r.label}</div>
            <div class="range-desc">${r.desc}</div>
          </div>
          <div class="range-check"><i class="fas fa-check"></i></div>
        </button>`).join('');
      section.style.display = 'block';
    }
    const btn = document.getElementById('btn-step3-next');
    if (btn) btn.disabled = true;
  },

  selectHeightRange(id, needKit) {
    state.heightRange = id;
    document.querySelectorAll('.range-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`range-${id}`)?.classList.add('selected');

    const box = document.getElementById('kitInfoBox');
    const txt = document.getElementById('kitInfoText');
    if (box && txt) {
      box.style.display = 'flex';
      if (needKit) {
        box.className = 'info-box kit-box';
        // B/D는 두번째 브라켓 문구 제외
        const bracketMsg = isPremiumModel()
          ? ''
          : '<br>추가 키트와 함께 두 번째 설치 브라켓도 구매해야 합니다.';
        txt.innerHTML = `<strong>추가 키트 필요</strong><br>창문 높이가 높은 경우 추가 키트가 필요합니다.${bracketMsg}`;
      } else {
        box.className = 'info-box info-box-green';
        txt.innerHTML = '<strong>추가 키트 불필요</strong><br>현재 높이 범위에서는 기본 구성품만으로 설치 가능합니다.';
      }
    }
    const btn = document.getElementById('btn-step3-next');
    if (btn) btn.disabled = false;
  },

  /* ============================================================
     STEP 4: 창틀 깊이
     ============================================================ */
  selectSillDepth(depth) {
    state.sillDepth = depth;
    state.sillB = null; state.sillC = null; state.sillBCValid = false;
    document.querySelectorAll('[id^="choice-sill-"]').forEach(el => el.classList.remove('selected'));
    document.getElementById(`choice-sill-${depth}`)?.classList.add('selected');

    const section = document.getElementById('shallowSillSection');
    const btn     = document.getElementById('btn-step4-next');
    if (depth === 'shallow') {
      if (section) section.style.display = 'block';
      if (btn)     btn.disabled = true;
    } else {
      if (section) section.style.display = 'none';
      if (btn)     btn.disabled = false;
      ['sillB','sillC'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value=''; el.closest('.input-wrap')?.classList.remove('success','error'); }
      });
      const res = document.getElementById('sillBCResult');
      if (res) res.style.display = 'none';
    }
  },

  validateSillBC() {
    const bEl  = document.getElementById('sillB');
    const cEl  = document.getElementById('sillC');
    const resBox = document.getElementById('sillBCResult');
    const btn    = document.getElementById('btn-step4-next');
    const b = parseFloat(bEl?.value), c = parseFloat(cEl?.value);
    const bOk = !isNaN(b) && b >= INSTALL_CRITERIA.minSillB && b < INSTALL_CRITERIA.maxSillB;
    const cOk = !isNaN(c) && c >= INSTALL_CRITERIA.minSillC;

    if (!isNaN(b) && bEl.value !== '') {
      bEl.closest('.input-wrap').classList.toggle('success', bOk);
      bEl.closest('.input-wrap').classList.toggle('error', !bOk);
    }
    if (!isNaN(c) && cEl.value !== '') {
      cEl.closest('.input-wrap').classList.toggle('success', cOk);
      cEl.closest('.input-wrap').classList.toggle('error', !cOk);
    }

    if (bEl.value !== '' && cEl.value !== '') {
      state.sillBCValid = bOk && cOk;
      state.sillB = bOk ? b : null;
      state.sillC = cOk ? c : null;
      if (resBox) {
        resBox.style.display = 'flex';
        if (bOk && cOk) {
          resBox.className = 'info-box info-box-green';
          // B/D는 두번째 브라켓 문구 미노출
          const bracketLine = isPremiumModel()
            ? '<p style="margin-top:6px;">프리미엄/하이브리드 제품은 동봉된 볼트만으로 모든 창틀 방법 설치 가능합니다.</p>'
            : '<p style="margin-top:6px;">그 외 모델은 \'두 번째 설치 브라켓\'을 별도 구매해야 합니다.</p>';
          const kitLine = state.heightRange === 'kit'
            ? '<p style="margin-top:6px;">창문 높이가 높은 경우 추가 키트를 같이 구매해 주세요.</p>'
            : '';
          resBox.innerHTML = `<i class="fas fa-check-circle"></i><div>
            <strong>모든 창틀 설치 가능 조건 충족</strong>
            ${bracketLine}${kitLine}
          </div>`;
          if (btn) btn.disabled = false;
        } else {
          resBox.className = 'info-box info-box-red';
          let msg = '';
          if (!bOk) msg += `<p>창틀 높이(b) ${b}cm → 1cm 이상 2cm 미만 필요</p>`;
          if (!cOk) msg += `<p>창틀 홈 너비(c) ${c}cm → 1.2cm 이상 필요</p>`;
          resBox.innerHTML = `<i class="fas fa-times-circle"></i><div>${msg}</div>`;
          if (btn) btn.disabled = true;
        }
      }
    } else {
      if (resBox) resBox.style.display = 'none';
      if (btn) btn.disabled = true;
    }
  },

  /* ============================================================
     STEP 5: 창문 환경 (단일 선택)
     ============================================================ */
  selectEnv(type) {
    state.envType = type;
    document.querySelectorAll('.env-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`env-card-${type}`)?.classList.add('selected');
    document.getElementById('thickGuide').style.display = (type === 'thick') ? 'block' : 'none';
    document.getElementById('splitGuide').style.display = (type === 'split') ? 'block' : 'none';
    const btn = document.getElementById('btn-step5-next');
    if (btn) btn.disabled = false;
  },

  validateFrameA() {
    const input = document.getElementById('frameA');
    const hint  = document.getElementById('frameAHint');
    const a = parseFloat(input?.value);
    if (!isNaN(a) && a > 0) {
      state.frameA = a;
      const wrap = input.closest('.input-wrap');
      if (a >= 1.2) {
        wrap.classList.add('success'); wrap.classList.remove('error');
        hint.className = 'input-hint success';
        hint.textContent = `✓ ${a}cm - 두꺼운 창틀 설치 방법 적용 필요`;
      } else {
        wrap.classList.remove('success','error');
        hint.className = 'input-hint';
        hint.textContent = `${a}cm - 두꺼운 창틀 방법 불필요 (1.2cm 미만)`;
      }
    } else { state.frameA = null; }
  },

  /* ============================================================
     결과 계산
     ============================================================ */
  showResult() {
    const result = this.calculateResult();
    this.renderResult(result);
    this.goTo('screen-6');
  },

  calculateResult() {
    const s = state;
    const premium = isPremiumModel();
    const result  = {
      canInstall: true, level: 'success',
      checks: [], kitRequired: false, kitType: null,
      needSecondBracket: false, specials: [], installSteps: []
    };

    /* 가로 조건 */
    if (s.windowWidth !== null) {
      const ok = s.windowWidth >= INSTALL_CRITERIA.minWidth;
      if (!ok) { result.canInstall = false; result.level = 'danger'; }
      result.checks.push({ ok, warn:false,
        icon: ok ? 'fa-check-circle' : 'fa-times-circle',
        text: ok
          ? `열리는 창문 가로 ${s.windowWidth}cm ✓ (38cm 이상 충족)`
          : `열리는 창문 가로 ${s.windowWidth}cm ✗ (최소 38cm 미달 - 설치 불가)`
      });
    }

    /* 세로(높이) 조건 */
    if (s.windowHeight !== null && s.productType) {
      const minH  = s.productType === 'standard' ? INSTALL_CRITERIA.minHeightStandard : INSTALL_CRITERIA.minHeightMini;
      const label = s.productType === 'standard' ? '일반' : '미니';
      const ok    = s.windowHeight >= minH;
      if (!ok && result.level !== 'danger') result.level = 'warning';
      result.checks.push({ ok, warn:!ok,
        icon: ok ? 'fa-check-circle' : 'fa-exclamation-circle',
        text: ok
          ? `창문 높이 ${s.windowHeight}cm ✓ (${label} 제품 ${minH}cm 이상 충족)`
          : `창문 높이 ${s.windowHeight}cm - ${label} 제품 최소 기준(${minH}cm) 미달`
      });
    }

    /* 창틀 깊이 */
    if (s.sillDepth === 'deep') {
      result.checks.push({ ok:true, warn:false, icon:'fa-check-circle', text:'창틀 깊이 2cm 이상 ✓ (일반 설치 방법 적용 가능)' });
    } else if (s.sillDepth === 'shallow') {
      if (result.level !== 'danger') result.level = 'warning';
      if (s.sillBCValid) {
        // B/D: 두번째 브라켓 불필요
        if (!premium) result.needSecondBracket = true;
        result.checks.push({ ok:false, warn:true, icon:'fa-exclamation-circle',
          text:`창틀 깊이 2cm 미만 - b(${s.sillB}cm), c(${s.sillC}cm) 조건 충족. 모든 창틀 설치 방법 확인 필요.`
        });
      } else {
        result.canInstall = false; result.level = 'danger';
        result.checks.push({ ok:false, warn:false, icon:'fa-times-circle',
          text:'창틀 깊이 2cm 미만 ✗ - b·c 치수 조건 미충족. 설치 방법을 재확인해 주세요.'
        });
      }
    }

    /* 추가 키트 */
    if (s.heightRange === 'kit') {
      result.kitRequired = true;
      result.kitType     = premium ? 'premium' : 'dual_inverter';
      // B/D: 두번째 브라켓 문구 미포함
      const bracketNote = premium ? '' : ' 추가 키트와 함께 두 번째 설치 브라켓도 구매해야 합니다.';
      result.checks.push({ ok:false, warn:true, icon:'fa-plus-circle',
        text:`창문 높이가 높아 추가 키트가 필요합니다.${bracketNote}`
      });
    }

    /* 특이사항 */
    if (s.envType === 'wood') {
      result.specials.push({ icon:'fa-tree', text:'나무 창틀: 나사 체결 시 파손 위험에 주의하시고, 전문가 설치를 권장합니다.' });
    }
    if (s.envType === 'split') {
      result.specials.push({ icon:'fa-columns', text:'분할 창문: 연장 키트를 연결하여 앞쪽 창틀에 설치해야 안전합니다.' });
    }
    if (s.envType === 'thick') {
      const a = s.frameA;
      result.specials.push({ icon:'fa-expand-alt',
        text: (a && a >= 1.2)
          ? `두꺼운 창틀(${a}cm): 두꺼운 창틀 설치 방법으로 설치해야 합니다. 프리미엄 제품은 볼트를 자유롭게 조절 가능합니다.`
          : '두꺼운 창틀: 창틀 너비(a) 1.2cm 이상이면 두꺼운 창틀 방법으로 설치해야 합니다.'
      });
    }
    // 두번째 브라켓 특이사항: A/C 모델 + shallow 시에만 표시
    if (result.needSecondBracket) {
      result.specials.push({ icon:'fa-tools',
        text:'창틀 깊이 2cm 미만 - 그 외 모델은 \'두 번째 설치 브라켓\'을 별도 구매해야 합니다.'
      });
    }

    result.installSteps = this.buildInstallSteps(premium);

    if (!result.canInstall) {
      result.headline = '설치가 어렵습니다.';
      result.subline  = '입력하신 창문 조건이 설치 기준을 충족하지 못했습니다.\n고객센터에 문의해 주세요.';
    } else if (result.level === 'warning') {
      result.headline = '설치 가능 (추가 조치 필요)';
      result.subline  = '기본 조건은 충족하나, 추가 키트 또는 부품이 필요합니다.';
    } else {
      result.headline = '설치 가능합니다! ✓';
      result.subline  = '조건을 모두 충족합니다. 해당 창문에 설치 가능합니다.';
    }
    return result;
  },

  buildInstallSteps(premium) {
    const s = state;
    const steps = [];
    steps.push({ num:1, title:'창문 측정 및 준비', desc:'창문 가로·세로 치수를 재확인하고 설치 공간을 확보합니다.' });
    if (s.sillDepth === 'shallow') {
      const bracketNote = premium
        ? '프리미엄/하이브리드 제품은 동봉된 볼트만으로 모든 창틀 방법 설치 가능합니다.'
        : '정속형/인버터/듀얼인버터 모델은 두 번째 브라켓을 별도 구매해야 합니다.';
      steps.push({ num:2, title:'모든 창틀 설치 방법 적용', desc:'창틀 깊이 2cm 미만이므로 모든 창틀 설치 방법을 사용하세요. ' + bracketNote });
    } else {
      steps.push({ num:2, title:'창틀 브라켓 설치', desc:'제공된 브라켓을 창틀에 맞게 설치합니다.' });
    }
    /* 추가키트 실제 높이 기준으로 판단 */
    const hVal2 = s.windowHeight || 0;
    const kitThreshold2 = s.productType === 'mini' ? 132 : 148;
    const needKitStep = (s.heightRange === 'kit') || (s.productType !== null && hVal2 >= kitThreshold2) || (s.envType === 'split');
    if (needKitStep) {
      const note = premium ? '추가 키트를 연결합니다.' : '추가 키트와 두 번째 설치 브라켓을 연결합니다.';
      const kitReason2 = s.envType === 'split' ? '분할 창문 연장 키트' : '추가 키트(창문 높이 ' + hVal2 + 'cm)';
      steps.push({ num:steps.length+1, title: kitReason2 + ' 연결', desc: note });
    }
    if (s.envType === 'thick') steps.push({ num:steps.length+1, title:'두꺼운 창틀 설치 방법 적용', desc:'창틀 너비(a) 1.2cm 이상이면 두꺼운 창틀 방법으로 설치합니다.' });
    steps.push({ num:steps.length+1, title:'에어컨 본체 장착', desc:'브라켓에 에어컨 본체를 올려 고정합니다. 흔들림 없이 안전하게 고정되었는지 확인합니다.' });
    steps.push({ num:steps.length+1, title:'완료 및 작동 확인', desc:'전원을 연결하고 냉방 기능이 정상 작동하는지 확인합니다.' });
    return steps;
  },

  /* ============================================================
     결과 화면 렌더링
     ============================================================ */
  renderResult(result) {
    const s = state;
    const premium = isPremiumModel();

    /* 헤더 */
    const hEl = document.getElementById('resultHeader');
    if (hEl) {
      const cls  = result.level === 'success' ? 'result-header-success' : result.level === 'warning' ? 'result-header-warning' : 'result-header-danger';
      const icon = result.level === 'success' ? 'fa-check-circle'       : result.level === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle';
      hEl.innerHTML = `<div class="${cls}">
        <div class="result-header-icon"><i class="fas ${icon}"></i></div>
        <div class="result-header-title">${result.headline}</div>
        <div class="result-header-desc">${result.subline.replace(/\n/g,'<br>')}</div>
      </div>`;
    }

    /* 요약 */
    const summaryEl = document.getElementById('summaryList');
    if (summaryEl) {
      const modelInfo  = s.modelGroup ? MODEL_GROUPS[s.modelGroup] : null;
      const hrData     = s.productType && s.heightRange ? HEIGHT_RANGES[s.productType].find(r=>r.id===s.heightRange) : null;
      const envLabels  = { plastic:'플라스틱 샷시', thick:'두꺼운 창틀', wood:'나무 창틀', split:'분할 창문 (추가 키트 필요)' };
      summaryEl.innerHTML = [
        ['에어컨 모델',     modelInfo ? `${modelInfo.label} (그룹 ${s.modelGroup})` : '-'],
        ['창문 유형',       s.windowType === 'sliding' ? '미닫이 창문' : '-'],
        ['가로 × 세로',     `${s.windowWidth||'-'}cm × ${s.windowHeight||'-'}cm`],
        ['제품 유형',       s.productType === 'standard' ? '일반 제품' : s.productType === 'mini' ? '미니 제품' : '-'],
        ['창문 높이 범위',  hrData ? hrData.label : '-'],
        ['창틀 깊이',       s.sillDepth === 'deep' ? '2cm 이상 (정상)' : s.sillDepth === 'shallow' ? '2cm 미만' : '-'],
        ['창문 환경',       s.envType ? (envLabels[s.envType]||'-') : '-']
      ].map(([l,v])=>`<div class="summary-item"><span class="summary-label">${l}</span><span class="summary-value">${v}</span></div>`).join('');
    }

    /* 조건 체크 */
    const checkEl = document.getElementById('checkList');
    if (checkEl) {
      checkEl.innerHTML = result.checks.map(c => {
        const cls = c.ok ? 'check-item-ok' : c.warn ? 'check-item-warn' : 'check-item-fail';
        return `<div class="check-item ${cls}"><i class="fas ${c.icon} check-icon"></i><div class="check-text">${c.text}</div></div>`;
      }).join('');
    }

    /* 키트 */
    const kitEl = document.getElementById('kitList');
    if (kitEl) {
      if (result.kitRequired && result.kitType) {
        const kit  = KIT_INFO[result.kitType];
        // B/D(프리미엄/하이브리드): 두 번째 브라켓 문구 절대 미표시
        const note = premium
          ? '<p style="margin-top:4px;">추가 키트를 구매해 주세요.</p>'
          : '<p style="margin-top:4px;">추가 키트와 함께 <strong>두 번째 설치 브라켓</strong>도 구매해야 합니다.</p>';
        kitEl.innerHTML = `<div class="kit-item">
          <div class="kit-icon"><i class="fas fa-plus-circle"></i></div>
          <div class="kit-text">
            <strong>${kit.name} <span style="color:var(--danger);font-size:12px;">필요</span></strong>
            <p>${kit.desc}</p>${note}
          </div>
        </div>`;
      } else if (result.needSecondBracket && !premium) {
        // A/C 그룹 + shallow 시에만 표시 (절대 B/D에는 표시 안 함)
        kitEl.innerHTML = `<div class="kit-item">
          <div class="kit-icon"><i class="fas fa-wrench"></i></div>
          <div class="kit-text">
            <strong>두 번째 설치 브라켓 <span style="color:var(--warning);font-size:12px;">별도 구매 필요</span></strong>
            <p>창틀 깊이가 2cm 미만이므로, 정속형/인버터/듀얼인버터 모델은 두 번째 설치 브라켓을 별도 구매해야 합니다.</p>
          </div>
        </div>`;
      } else {
        kitEl.innerHTML = `<div class="kit-item">
          <div class="kit-icon" style="background:var(--success-light);">
            <i class="fas fa-check-circle" style="color:var(--success);"></i>
          </div>
          <div class="kit-text"><strong>추가 키트 불필요</strong><p>기본 구성품만으로 설치 가능합니다.</p></div>
        </div>`;
      }
    }

    /* 호환 모델 */
    const modelEl = document.getElementById('modelList');
    if (modelEl) {
      const dKit = KIT_INFO.dual_inverter;
      const pKit = KIT_INFO.premium;
      modelEl.innerHTML = `
        <div style="margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;color:var(--gray-600);margin-bottom:8px;">
            <i class="fas fa-tag" style="color:var(--primary);margin-right:6px;"></i>듀얼인버터 추가 키트 호환 모델
          </div>
          <div class="model-tags">
            ${dKit.models.map(m=>`<span class="model-tag ${result.kitType==='dual_inverter'?'model-tag-highlight':''}">${m}</span>`).join('')}
          </div>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--gray-600);margin-bottom:8px;">
            <i class="fas fa-tag" style="color:var(--primary);margin-right:6px;"></i>프리미엄 추가 키트 호환 모델
          </div>
          <div class="model-tags">
            ${pKit.models.map(m=>`<span class="model-tag ${result.kitType==='premium'?'model-tag-highlight':''}">${m}</span>`).join('')}
          </div>
        </div>`;
    }

    /* 특이사항 */
    const spSec  = document.getElementById('specialSection');
    const spList = document.getElementById('specialList');
    if (spSec && spList) {
      if (result.specials.length > 0) {
        spSec.style.display = 'block';
        spList.innerHTML = result.specials.map(sp =>
          `<div class="special-item"><i class="fas ${sp.icon}"></i><p>${sp.text}</p></div>`
        ).join('');
      } else { spSec.style.display = 'none'; }
    }

    /* 설치 방법 */
    const installEl = document.getElementById('installGuide');
    if (installEl) {
      installEl.innerHTML = result.installSteps.map(step =>
        `<div class="install-step">
          <div class="install-step-num">${step.num}</div>
          <div class="install-step-content"><strong>${step.title}</strong><p>${step.desc}</p></div>
        </div>`
      ).join('');
    }

    /* 유튜브 버튼 */
    this.renderYoutubeButtons();
  },

  /* ============================================================
     유튜브 버튼 렌더링
     ============================================================ */
  renderYoutubeButtons() {
    const s       = state;
    const btnList = document.getElementById('youtubeBtnList');
    if (!btnList) return;

    if (!s.modelGroup || s.windowType !== 'sliding') {
      btnList.innerHTML = '<p style="color:#888;font-size:13px;">미닫이 창문 선택 시에만 설치 영상 안내가 제공됩니다.</p>';
      return;
    }

    const group  = MODEL_GROUPS[s.modelGroup].youtubeGroup;
    const videos = YOUTUBE_VIDEOS[group];
    const keys   = resolveYoutubeKeys();

    if (keys.length === 0) {
      btnList.innerHTML = '<p style="color:#888;font-size:13px;">해당 환경에 맞는 영상을 준비 중입니다.</p>';
      return;
    }

    btnList.innerHTML = keys
      .filter(k => videos[k])
      .map(k => {
        // 통합 가이드(all)는 구분선 추가
        const isAll = (k === 'all');
        const divider = isAll && keys.length > 1
          ? '<div style="border-top:1px solid rgba(255,255,255,0.15);margin:4px 0;"></div>'
          : '';
        return divider + `
        <a href="${videos[k].url}" target="_blank" rel="noopener noreferrer" class="youtube-btn${isAll ? ' youtube-btn-all' : ''}">
          <div class="youtube-btn-icon"><i class="fab fa-youtube"></i></div>
          <div class="youtube-btn-text">${videos[k].label}</div>
          <i class="fas fa-external-link-alt youtube-btn-arrow"></i>
        </a>`;
      }).join('');
  },

  /* ============================================================
     처음으로 / 공유
     ============================================================ */
  restart() {
    Object.assign(state, {
      currentScreen:'screen-0', screenHistory:[],
      modelGroup:null, windowType:null, windowWidth:null, windowHeight:null,
      productType:null, heightRange:null, sillDepth:null,
      sillB:null, sillC:null, sillBCValid:false,
      envType:null, frameA:null
    });
    document.querySelectorAll('.choice-card,.range-card,.model-card,.env-card').forEach(el=>el.classList.remove('selected'));
    document.querySelectorAll('.text-input').forEach(el=>{
      el.value=''; el.closest('.input-wrap')?.classList.remove('success','error');
    });
    ['btn-model-next','btn-step1-next','btn-step2-next','btn-step3-next','btn-step4-next'].forEach(id=>{
      const b=document.getElementById(id); if(b) b.disabled=true;
    });
    ['heightRangeSection','kitInfoBox','shallowSillSection','thickGuide','splitGuide','sillBCResult'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.style.display='none';
    });
    const btn1 = document.getElementById('btn-step1-next');
    if (btn1) { btn1.innerHTML='다음 <i class="fas fa-chevron-right"></i>'; btn1.onclick=()=>App.nextStep(); }
    this.showScreen('screen-0');
    this.showToast('처음으로 돌아왔습니다.');
  },

  /* 결과 공유 버튼 제거 — printResult() 삭제됨 */

  showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 2800);
  }
};

document.addEventListener('DOMContentLoaded', ()=>App.init());
