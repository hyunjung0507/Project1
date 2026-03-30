/* ============================================================
   창문형 에어컨 설치 안내 앱 - 메인 JavaScript
   ============================================================ */

'use strict';

/* ─── 제품 데이터 (더미) ─── */
const PRODUCTS = {
  dual_inverter: {
    name: '듀얼인버터 추가 키트',
    models: ['PWA-2200', 'PWA-2250', 'PWA-3200', 'PWA-3250', 'PWA-3300', 'PWA-M3100'],
    desc: '일반·미니 제품에 사용 가능한 듀얼인버터 추가 키트입니다.',
    type: 'standard'
  },
  premium: {
    name: '프리미엄 추가 키트',
    models: ['PWA-3400', 'PWA-3500', 'PWA-3600', 'PWA-M3500'],
    desc: '프리미엄 제품 전용 추가 키트입니다.',
    type: 'premium'
  }
};

/* ─── 앱 상태 ─── */
const state = {
  currentStep: 0,
  totalSteps: 6,
  windowType: null,        // 'sliding' | 'casement'
  windowWidth: null,       // 가로 cm
  windowHeight: null,      // 세로 cm
  productType: null,       // 'standard' | 'mini'
  heightRange: null,       // 'base' | 'kit' (키트 필요 여부)
  sillDepth: null,         // 'shallow' | 'deep'
  sillB: null,             // 창틀 높이 cm
  sillC: null,             // 창틀 홈 너비 cm
  sillBCValid: false,
  specials: new Set(),     // 'wood' | 'split' | 'thick'
  frameA: null             // 창틀 너비 cm (두꺼운 창틀)
};

/* ─── 높이 범위 정의 ─── */
const HEIGHT_RANGES = {
  standard: [
    {
      id: 'base',
      label: '92cm ~ 148cm',
      desc: '추가 키트 불필요',
      needKit: false,
      icon: 'fa-check-circle'
    },
    {
      id: 'kit',
      label: '148cm 초과',
      desc: '추가 키트 필요',
      needKit: true,
      icon: 'fa-plus-circle'
    }
  ],
  mini: [
    {
      id: 'base',
      label: '77cm ~ 132cm',
      desc: '추가 키트 불필요',
      needKit: false,
      icon: 'fa-check-circle'
    },
    {
      id: 'kit',
      label: '132cm 초과',
      desc: '추가 키트 필요',
      needKit: true,
      icon: 'fa-plus-circle'
    }
  ]
};

/* ─── 설치 조건 기준 ─── */
const INSTALL_CRITERIA = {
  minWidth: 38,        // cm
  minHeightStandard: 92,
  minHeightMini: 77,
  minSillDepth: 2,     // cm
  minSillB: 1,
  maxSillB: 2,
  minSillC: 1.2
};

/* ============================================================
   App 객체
   ============================================================ */
const App = {

  /* ─── 앱 초기화 ─── */
  init() {
    this.updateHeader();
    this.showScreen(0);
    console.log('창문형 에어컨 설치 안내 앱 초기화 완료');
  },

  /* ─── 안내 시작 ─── */
  startGuide() {
    this.nextStep();
  },

  /* ─── 화면 전환 ─── */
  showScreen(step) {
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    // 해당 화면 표시
    const screen = document.getElementById(`screen-${step}`);
    if (screen) {
      screen.classList.remove('hidden');
    }
    // 헤더 업데이트
    this.updateHeader();
    // 스크롤 top으로
    const appMain = document.getElementById('appMain');
    if (appMain) appMain.scrollTop = 0;
  },

  /* ─── 헤더 업데이트 ─── */
  updateHeader() {
    const step = state.currentStep;
    const btnBack = document.getElementById('btnBack');
    const progressBar = document.getElementById('progressBar');
    const stepIndicator = document.getElementById('stepIndicator');
    const progressBarWrap = document.getElementById('progressBarWrap');

    if (step === 0) {
      // 시작 화면
      if (btnBack) btnBack.style.display = 'none';
      if (progressBarWrap) progressBarWrap.style.display = 'none';
      if (stepIndicator) stepIndicator.textContent = '';
    } else if (step === 6) {
      // 결과 화면
      if (btnBack) btnBack.style.display = 'flex';
      if (progressBarWrap) progressBarWrap.style.display = 'block';
      if (progressBar) progressBar.style.width = '100%';
      if (stepIndicator) stepIndicator.textContent = '✅ 안내 완료';
    } else {
      if (btnBack) btnBack.style.display = 'flex';
      if (progressBarWrap) progressBarWrap.style.display = 'block';
      const percent = (step / 5) * 100;
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (stepIndicator) stepIndicator.textContent = `${step} / 5 단계`;
    }
  },

  /* ─── 다음 단계 ─── */
  nextStep() {
    if (state.currentStep < state.totalSteps) {
      state.currentStep++;
      this.showScreen(state.currentStep);
    }
  },

  /* ─── 이전 단계 ─── */
  prevStep() {
    if (state.currentStep > 0) {
      state.currentStep--;
      this.showScreen(state.currentStep);
    }
  },

  /* ============================================================
     STEP 1: 창문 유형 선택
     ============================================================ */
  selectWindowType(type) {
    state.windowType = type;
    // UI 업데이트
    document.querySelectorAll('[id^="choice-window-"]').forEach(el => el.classList.remove('selected'));
    const selected = document.getElementById(`choice-window-${type === 'sliding' ? 'sliding' : 'casement'}`);
    if (selected) selected.classList.add('selected');
    // 여닫이 경고
    const warning = document.getElementById('casementWarning');
    if (warning) warning.style.display = type === 'casement' ? 'flex' : 'none';
    // 다음 버튼 활성화
    const btn = document.getElementById('btn-step1-next');
    if (btn) btn.disabled = false;
  },

  /* ============================================================
     STEP 2: 창문 가로/세로 입력 검증
     ============================================================ */
  validateStep2() {
    const wInput = document.getElementById('windowWidth');
    const hInput = document.getElementById('windowHeight');
    const widthHint = document.getElementById('widthHint');
    const heightHint = document.getElementById('heightHint');
    const btn = document.getElementById('btn-step2-next');

    const w = parseFloat(wInput?.value);
    const h = parseFloat(hInput?.value);

    // 가로 검증
    if (!isNaN(w) && w > 0) {
      const wWrap = wInput.closest('.input-wrap');
      if (w < INSTALL_CRITERIA.minWidth) {
        wWrap.classList.add('error'); wWrap.classList.remove('success');
        widthHint.className = 'input-hint error';
        widthHint.textContent = `⚠ ${w}cm는 최소 기준(38cm)에 미달합니다. 설치가 어려울 수 있습니다.`;
      } else {
        wWrap.classList.add('success'); wWrap.classList.remove('error');
        widthHint.className = 'input-hint success';
        widthHint.textContent = `✓ ${w}cm - 가로 조건 충족`;
      }
      state.windowWidth = w;
    } else {
      if (wInput && wInput.value !== '') {
        wInput.closest('.input-wrap')?.classList.add('error');
      }
      state.windowWidth = null;
    }

    // 세로 검증
    if (!isNaN(h) && h > 0) {
      const hWrap = hInput.closest('.input-wrap');
      state.windowHeight = h;
      if (h < INSTALL_CRITERIA.minHeightMini) {
        hWrap.classList.add('error'); hWrap.classList.remove('success');
        heightHint.className = 'input-hint error';
        heightHint.textContent = `⚠ ${h}cm는 미니 제품 최소 기준(77cm)에도 미달합니다.`;
      } else if (h < INSTALL_CRITERIA.minHeightStandard) {
        hWrap.classList.remove('error', 'success');
        heightHint.className = 'input-hint';
        heightHint.textContent = `ℹ ${h}cm - 미니 제품 설치 가능 (일반 제품은 92cm 이상 필요)`;
      } else {
        hWrap.classList.add('success'); hWrap.classList.remove('error');
        heightHint.className = 'input-hint success';
        heightHint.textContent = `✓ ${h}cm - 일반/미니 제품 모두 설치 가능`;
      }
    } else {
      if (hInput && hInput.value !== '') {
        hInput.closest('.input-wrap')?.classList.add('error');
      }
      state.windowHeight = null;
    }

    // 다음 버튼
    const valid = state.windowWidth !== null && state.windowHeight !== null
      && !isNaN(state.windowWidth) && !isNaN(state.windowHeight)
      && state.windowWidth > 0 && state.windowHeight > 0;
    if (btn) btn.disabled = !valid;
  },

  /* ============================================================
     STEP 3: 제품 유형 선택 및 높이 범위
     ============================================================ */
  selectProductType(type) {
    state.productType = type;
    state.heightRange = null;

    // UI 업데이트
    document.querySelectorAll('[id^="choice-product-"]').forEach(el => el.classList.remove('selected'));
    document.getElementById(`choice-product-${type}`)?.classList.add('selected');

    // 높이 범위 카드 표시
    const section = document.getElementById('heightRangeSection');
    const cards = document.getElementById('heightRangeCards');
    if (section && cards) {
      const ranges = HEIGHT_RANGES[type];
      cards.innerHTML = ranges.map(r => `
        <button class="range-card" id="range-${r.id}" onclick="App.selectHeightRange('${r.id}', ${r.needKit})">
          <div class="range-icon"><i class="fas ${r.icon}"></i></div>
          <div class="range-content">
            <div class="range-label">${r.label}</div>
            <div class="range-desc">${r.desc}</div>
          </div>
          <div class="range-check"><i class="fas fa-check"></i></div>
        </button>
      `).join('');
      section.style.display = 'block';
    }

    // 창문 세로 치수 반영 힌트
    const h = state.windowHeight;
    if (h !== null) {
      const minH = type === 'standard' ? INSTALL_CRITERIA.minHeightStandard : INSTALL_CRITERIA.minHeightMini;
      if (h < minH) {
        this.showKitInfo(`⚠ 입력하신 창문 높이(${h}cm)가 ${type === 'standard' ? '일반' : '미니'} 제품 최소 기준(${minH}cm)에 미달합니다. 다른 제품 유형을 검토해 주세요.`, 'warn');
      } else {
        this.hideKitInfo();
      }
    }

    // 다음 버튼 비활성화 (범위 선택 필요)
    const btn = document.getElementById('btn-step3-next');
    if (btn) btn.disabled = true;
  },

  selectHeightRange(rangeId, needKit) {
    state.heightRange = rangeId;

    // UI 업데이트
    document.querySelectorAll('.range-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`range-${rangeId}`)?.classList.add('selected');

    // 키트 안내
    if (needKit) {
      this.showKitInfo(
        `<strong>추가 키트 필요</strong><br>창문 높이가 높은 경우, 추가 키트와 두 번째 설치 브라켓을 함께 구매해야 합니다.`,
        'kit'
      );
    } else {
      this.showKitInfo(`<strong>추가 키트 불필요</strong><br>선택하신 높이 범위에서는 추가 키트 없이 설치 가능합니다.`, 'ok');
    }

    // 다음 버튼 활성화
    const btn = document.getElementById('btn-step3-next');
    if (btn) btn.disabled = false;
  },

  showKitInfo(text, type) {
    const box = document.getElementById('kitInfoBox');
    const textEl = document.getElementById('kitInfoText');
    if (!box || !textEl) return;
    box.style.display = 'flex';
    textEl.innerHTML = text;

    box.className = 'info-box';
    if (type === 'kit') box.classList.add('kit-box');
    else if (type === 'warn') box.classList.add('warning-box');
    else if (type === 'ok') box.classList.add('info-box-green');
  },

  hideKitInfo() {
    const box = document.getElementById('kitInfoBox');
    if (box) box.style.display = 'none';
  },

  /* ============================================================
     STEP 4: 창틀 깊이
     ============================================================ */
  selectSillDepth(depth) {
    state.sillDepth = depth;
    state.sillB = null;
    state.sillC = null;
    state.sillBCValid = false;

    // UI 업데이트
    document.querySelectorAll('[id^="choice-sill-"]').forEach(el => el.classList.remove('selected'));
    document.getElementById(`choice-sill-${depth}`)?.classList.add('selected');

    const section = document.getElementById('shallowSillSection');
    const btn = document.getElementById('btn-step4-next');

    if (depth === 'shallow') {
      if (section) section.style.display = 'block';
      if (btn) btn.disabled = true; // b, c 입력 필요
    } else {
      if (section) section.style.display = 'none';
      if (btn) btn.disabled = false;
      // 입력값 초기화
      const bInput = document.getElementById('sillB');
      const cInput = document.getElementById('sillC');
      if (bInput) bInput.value = '';
      if (cInput) cInput.value = '';
    }
  },

  validateSillBC() {
    const bInput = document.getElementById('sillB');
    const cInput = document.getElementById('sillC');
    const resultBox = document.getElementById('sillBCResult');
    const btn = document.getElementById('btn-step4-next');

    const b = parseFloat(bInput?.value);
    const c = parseFloat(cInput?.value);

    const bValid = !isNaN(b) && b >= INSTALL_CRITERIA.minSillB && b < INSTALL_CRITERIA.maxSillB;
    const cValid = !isNaN(c) && c >= INSTALL_CRITERIA.minSillC;

    // b 입력 검증
    if (!isNaN(b) && bInput.value !== '') {
      const bWrap = bInput.closest('.input-wrap');
      if (bValid) {
        bWrap.classList.add('success'); bWrap.classList.remove('error');
      } else {
        bWrap.classList.add('error'); bWrap.classList.remove('success');
      }
    }

    // c 입력 검증
    if (!isNaN(c) && cInput.value !== '') {
      const cWrap = cInput.closest('.input-wrap');
      if (cValid) {
        cWrap.classList.add('success'); cWrap.classList.remove('error');
      } else {
        cWrap.classList.add('error'); cWrap.classList.remove('success');
      }
    }

    // 결과 안내
    if (!isNaN(b) && !isNaN(c) && bInput.value !== '' && cInput.value !== '') {
      if (bValid && cValid) {
        state.sillB = b;
        state.sillC = c;
        state.sillBCValid = true;
        if (resultBox) {
          resultBox.style.display = 'flex';
          resultBox.className = 'info-box info-box-green';
          resultBox.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div>
              <strong>모든 창틀 설치 가능 조건 충족</strong>
              <p>프리미엄 제품은 동봉된 모든 창틀 설치용 볼트를 체결하면 모든 창틀 방법으로 설치 가능합니다.</p>
              <p style="margin-top:6px;">그 외 모델은 '두 번째 설치 브라켓'을 별도 구매해야 합니다.</p>
              ${state.heightRange === 'kit' ? '<p style="margin-top:6px;">창문 높이가 높은 경우, 추가 키트와 두 번째 설치 브라켓을 같이 구매해 주세요.</p>' : ''}
            </div>
          `;
          if (btn) btn.disabled = false;
        }
      } else {
        state.sillBCValid = false;
        if (resultBox) {
          resultBox.style.display = 'flex';
          resultBox.className = 'info-box info-box-red';
          let msg = '<i class="fas fa-times-circle"></i><div>';
          if (!bValid) msg += `<p>창틀 높이(b): ${b}cm → 1cm 이상 2cm 미만이어야 합니다.</p>`;
          if (!cValid) msg += `<p>창틀 홈 너비(c): ${c}cm → 1.2cm 이상이어야 합니다.</p>`;
          msg += '</div>';
          resultBox.innerHTML = msg;
          if (btn) btn.disabled = true;
        }
      }
    } else {
      if (resultBox) resultBox.style.display = 'none';
      if (btn) btn.disabled = true;
    }
  },

  /* ============================================================
     STEP 5: 특수 창문 유형
     ============================================================ */
  toggleSpecial(type) {
    const card = document.getElementById(`choice-special-${type}`);

    if (state.specials.has(type)) {
      state.specials.delete(type);
      card?.classList.remove('selected');
    } else {
      state.specials.add(type);
      card?.classList.add('selected');
    }

    // 분할 창문 안내
    const splitGuide = document.getElementById('splitGuide');
    if (splitGuide) {
      splitGuide.style.display = state.specials.has('split') ? 'block' : 'none';
    }

    // 두꺼운 창틀 안내
    const thickGuide = document.getElementById('thickGuide');
    if (thickGuide) {
      thickGuide.style.display = state.specials.has('thick') ? 'block' : 'none';
    }
  },

  validateFrameA() {
    const aInput = document.getElementById('frameA');
    const hint = document.getElementById('frameAHint');
    const a = parseFloat(aInput?.value);

    if (!isNaN(a) && a > 0) {
      const aWrap = aInput.closest('.input-wrap');
      state.frameA = a;
      if (a >= 1.2) {
        aWrap.classList.add('success'); aWrap.classList.remove('error');
        hint.className = 'input-hint success';
        hint.textContent = `✓ ${a}cm - 두꺼운 창틀 설치 방법 적용 필요`;
      } else {
        aWrap.classList.remove('success', 'error');
        hint.className = 'input-hint';
        hint.textContent = `${a}cm - 두꺼운 창틀 방법 불필요 (1.2cm 미만)`;
      }
    } else {
      state.frameA = null;
    }
  },

  /* ============================================================
     결과 계산 및 표시
     ============================================================ */
  showResult() {
    // 결과 계산
    const result = this.calculateResult();
    // 결과 화면 렌더링
    this.renderResult(result);
    // 결과 화면으로 이동
    state.currentStep = 6;
    this.showScreen(6);
  },

  calculateResult() {
    const s = state;
    const result = {
      canInstall: true,      // 설치 가능 여부
      level: 'success',      // 'success' | 'warning' | 'danger'
      checks: [],            // 조건 체크 목록
      kitRequired: false,    // 추가 키트 필요 여부
      kitType: null,         // 'dual_inverter' | 'premium' | null
      needSecondBracket: false,
      specials: [],
      installSteps: []
    };

    /* ── 가로 조건 ── */
    if (s.windowWidth !== null) {
      if (s.windowWidth >= INSTALL_CRITERIA.minWidth) {
        result.checks.push({
          ok: true,
          icon: 'fa-check-circle',
          text: `열리는 창문 가로 ${s.windowWidth}cm ✓ (최소 38cm 이상 충족)`
        });
      } else {
        result.canInstall = false;
        result.level = 'danger';
        result.checks.push({
          ok: false,
          warn: false,
          icon: 'fa-times-circle',
          text: `열리는 창문 가로 ${s.windowWidth}cm ✗ (최소 38cm 미달 - 설치 불가)`
        });
      }
    }

    /* ── 창문 높이(세로) 조건 ── */
    if (s.windowHeight !== null && s.productType) {
      const minH = s.productType === 'standard'
        ? INSTALL_CRITERIA.minHeightStandard
        : INSTALL_CRITERIA.minHeightMini;
      const productLabel = s.productType === 'standard' ? '일반' : '미니';

      if (s.windowHeight >= minH) {
        result.checks.push({
          ok: true,
          icon: 'fa-check-circle',
          text: `창문 높이 ${s.windowHeight}cm ✓ (${productLabel} 제품 최소 ${minH}cm 이상 충족)`
        });
      } else {
        if (result.level !== 'danger') result.level = 'warning';
        result.checks.push({
          ok: false,
          warn: true,
          icon: 'fa-exclamation-circle',
          text: `창문 높이 ${s.windowHeight}cm - ${productLabel} 제품 최소 기준(${minH}cm) 미달. 추가 키트가 필요할 수 있습니다.`
        });
      }
    }

    /* ── 창틀 깊이 조건 ── */
    if (s.sillDepth === 'deep') {
      result.checks.push({
        ok: true,
        icon: 'fa-check-circle',
        text: '창틀 깊이 2cm 이상 ✓ (일반 설치 방법 적용 가능)'
      });
    } else if (s.sillDepth === 'shallow') {
      if (result.level !== 'danger') result.level = 'warning';
      if (s.sillBCValid) {
        result.needSecondBracket = true;
        result.checks.push({
          ok: false,
          warn: true,
          icon: 'fa-exclamation-circle',
          text: `창틀 깊이 2cm 미만 - b(${s.sillB}cm), c(${s.sillC}cm) 조건 충족. 모든 창틀 설치 방법 확인 필요.`
        });
      } else {
        result.canInstall = false;
        result.level = 'danger';
        result.checks.push({
          ok: false,
          warn: false,
          icon: 'fa-times-circle',
          text: '창틀 깊이 2cm 미만 ✗ - 모든 창틀 설치 방법을 확인해 주세요.'
        });
      }
    }

    /* ── 추가 키트 필요 여부 ── */
    if (s.heightRange === 'kit') {
      result.kitRequired = true;
      if (s.productType === 'standard') {
        result.kitType = 'dual_inverter';
      } else {
        result.kitType = 'dual_inverter'; // 미니도 동일 키트 사용
      }
    }

    // 프리미엄 제품 모델이 선택된 경우 (여기서는 키트 타입으로 구분)
    // 실제로는 선택된 모델에 따라 분기하나, 여기서는 제품 유형으로 구분
    if (s.heightRange === 'kit') {
      result.checks.push({
        ok: false,
        warn: true,
        icon: 'fa-plus-circle',
        text: '창문 높이가 높은 경우: 추가 키트와 두 번째 설치 브라켓을 함께 구매해야 합니다.'
      });
    }

    /* ── 특수 창문 유형 ── */
    if (s.specials.has('wood')) {
      result.specials.push({
        icon: 'fa-tree',
        text: '나무 창틀: 나사 체결 시 파손 위험에 주의하시고, 전문가 설치를 권장합니다.'
      });
    }
    if (s.specials.has('split')) {
      result.specials.push({
        icon: 'fa-columns',
        text: '분할 창문: 연장 키트를 연결하여 앞쪽 창틀에 설치해야 안전합니다.'
      });
    }
    if (s.specials.has('thick')) {
      const a = s.frameA;
      result.specials.push({
        icon: 'fa-expand-alt',
        text: a && a >= 1.2
          ? `두꺼운 창틀(${a}cm): 두꺼운 창틀 설치 방법으로 설치해야 합니다. 프리미엄 제품은 볼트를 자유롭게 조절해 설치 가능합니다.`
          : '두꺼운 창틀: 창틀 너비(a)가 1.2cm 이상이면 두꺼운 창틀 방법으로 설치해야 합니다. 프리미엄 제품은 볼트를 자유롭게 조절 가능합니다.'
      });
    }
    if (s.needSecondBracket || s.sillDepth === 'shallow') {
      result.specials.push({
        icon: 'fa-tools',
        text: '프리미엄 제품은 동봉된 모든 창틀 설치용 볼트를 체결하면 모든 창틀 방법으로 설치 가능합니다. 그 외 모델은 두 번째 설치 브라켓을 별도 구매해야 합니다.'
      });
    }

    /* ── 설치 방법 안내 ── */
    result.installSteps = this.getInstallSteps();

    /* ── 전체 결과 문구 ── */
    if (!result.canInstall) {
      result.headline = '설치가 어렵습니다.';
      result.subline = '입력하신 창문 조건에서 설치 기준을 충족하지 못했습니다.\n세부 내용을 확인하시고, 고객센터에 문의해 주세요.';
    } else if (result.level === 'warning') {
      result.headline = '설치 가능 (추가 조치 필요)';
      result.subline = '기본 조건은 충족하나, 추가 키트 또는 부품이 필요합니다.\n아래 안내 사항을 꼭 확인해 주세요.';
    } else {
      result.headline = '설치 가능합니다! ✓';
      result.subline = '조건을 모두 충족합니다. 해당 창문에 설치 가능합니다.';
    }

    return result;
  },

  getInstallSteps() {
    const s = state;
    const steps = [];

    steps.push({
      num: 1,
      title: '창문 측정 및 준비',
      desc: '창문 가로·세로 치수를 재확인하고 설치 공간을 확보합니다.'
    });

    if (s.sillDepth === 'shallow') {
      steps.push({
        num: 2,
        title: '모든 창틀 설치 방법 적용',
        desc: '창틀 깊이가 2cm 미만이므로, 모든 창틀 설치 방법을 사용하세요. 프리미엄 제품은 동봉 볼트로 설치 가능, 그 외 제품은 두 번째 브라켓 구매 필요.'
      });
    } else {
      steps.push({
        num: 2,
        title: '창틀 브라켓 설치',
        desc: '제공된 브라켓을 창틀에 맞게 설치합니다. 창틀 깊이가 2cm 이상이므로 일반 설치 방법 적용 가능합니다.'
      });
    }

    if (s.heightRange === 'kit') {
      steps.push({
        num: 3,
        title: '추가 키트 연결',
        desc: '창문 높이가 높으므로 추가 키트와 두 번째 설치 브라켓을 연결합니다.'
      });
    }

    if (s.specials.has('split')) {
      steps.push({
        num: steps.length + 1,
        title: '연장 키트 설치 (분할 창문)',
        desc: '연장 키트를 연결하여 앞쪽 창틀에 고정합니다.'
      });
    }

    if (s.specials.has('thick')) {
      steps.push({
        num: steps.length + 1,
        title: '두꺼운 창틀 설치 방법 적용',
        desc: '창틀 너비(a)가 1.2cm 이상이면 두꺼운 창틀 방법으로 설치합니다. 프리미엄 제품은 볼트 위치를 자유롭게 조절 가능합니다.'
      });
    }

    steps.push({
      num: steps.length + 1,
      title: '에어컨 본체 장착',
      desc: '브라켓에 에어컨 본체를 올려 고정합니다. 흔들림 없이 안전하게 고정되었는지 확인합니다.'
    });

    steps.push({
      num: steps.length + 1,
      title: '완료 및 작동 확인',
      desc: '전원을 연결하고 냉방 기능이 정상 작동하는지 확인합니다. 창문 밀폐도 점검합니다.'
    });

    return steps;
  },

  /* ─── 결과 화면 렌더링 ─── */
  renderResult(result) {
    const s = state;

    /* ── 결과 헤더 ── */
    const resultHeader = document.getElementById('resultHeader');
    if (resultHeader) {
      const cls = result.level === 'success'
        ? 'result-header-success'
        : result.level === 'warning'
          ? 'result-header-warning'
          : 'result-header-danger';
      const icon = result.level === 'success'
        ? 'fa-check-circle'
        : result.level === 'warning'
          ? 'fa-exclamation-triangle'
          : 'fa-times-circle';
      resultHeader.innerHTML = `
        <div class="${cls}">
          <div class="result-header-icon"><i class="fas ${icon}"></i></div>
          <div class="result-header-title">${result.headline}</div>
          <div class="result-header-desc">${result.subline.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }

    /* ── 입력 요약 ── */
    const summaryList = document.getElementById('summaryList');
    if (summaryList) {
      const windowTypeLabel = s.windowType === 'sliding' ? '미닫이 창문' : '여닫이 창문';
      const productLabel = s.productType === 'standard' ? '일반 제품' : s.productType === 'mini' ? '미니 제품' : '-';
      const heightRangeData = s.productType && s.heightRange
        ? HEIGHT_RANGES[s.productType].find(r => r.id === s.heightRange)
        : null;
      const sillDepthLabel = s.sillDepth === 'deep' ? '2cm 이상 (정상)' : s.sillDepth === 'shallow' ? '2cm 미만' : '-';
      const specialLabels = [];
      if (s.specials.has('wood')) specialLabels.push('나무 창틀');
      if (s.specials.has('split')) specialLabels.push('분할 창문');
      if (s.specials.has('thick')) specialLabels.push('두꺼운 창틀');

      summaryList.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">창문 유형</span>
          <span class="summary-value">${s.windowType ? windowTypeLabel : '-'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">가로 × 세로</span>
          <span class="summary-value">${s.windowWidth ? s.windowWidth + 'cm' : '-'} × ${s.windowHeight ? s.windowHeight + 'cm' : '-'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">제품 유형</span>
          <span class="summary-value">${productLabel}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">창문 높이 범위</span>
          <span class="summary-value">${heightRangeData ? heightRangeData.label : '-'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">창틀 깊이</span>
          <span class="summary-value">${sillDepthLabel}</span>
        </div>
        ${s.sillDepth === 'shallow' && s.sillB ? `
        <div class="summary-item">
          <span class="summary-label">창틀 b+c 치수</span>
          <span class="summary-value">b: ${s.sillB}cm / c: ${s.sillC}cm</span>
        </div>` : ''}
        <div class="summary-item">
          <span class="summary-label">특수 창문 유형</span>
          <span class="summary-value">${specialLabels.length > 0 ? specialLabels.join(', ') : '없음'}</span>
        </div>
        ${s.specials.has('thick') && s.frameA ? `
        <div class="summary-item">
          <span class="summary-label">창틀 너비(a)</span>
          <span class="summary-value">${s.frameA}cm</span>
        </div>` : ''}
      `;
    }

    /* ── 조건 체크 ── */
    const checkList = document.getElementById('checkList');
    if (checkList) {
      checkList.innerHTML = result.checks.map(c => {
        const cls = c.ok ? 'check-item-ok' : c.warn ? 'check-item-warn' : 'check-item-fail';
        return `
          <div class="check-item ${cls}">
            <i class="fas ${c.icon} check-icon"></i>
            <div class="check-text">${c.text}</div>
          </div>
        `;
      }).join('');
    }

    /* ── 필요 키트/제품 ── */
    const kitList = document.getElementById('kitList');
    if (kitList) {
      if (result.kitRequired && result.kitType) {
        const kit = PRODUCTS[result.kitType];
        kitList.innerHTML = `
          <div class="kit-item">
            <div class="kit-icon"><i class="fas fa-plus-circle"></i></div>
            <div class="kit-text">
              <strong>${kit.name} <span style="color:var(--danger);font-size:12px;">필요</span></strong>
              <p>${kit.desc}</p>
              <p style="margin-top:4px;">창문 높이가 높은 경우, 추가 키트와 두 번째 설치 브라켓을 함께 구매해야 합니다.</p>
            </div>
          </div>
        `;
      } else if (result.needSecondBracket) {
        kitList.innerHTML = `
          <div class="kit-item">
            <div class="kit-icon"><i class="fas fa-wrench"></i></div>
            <div class="kit-text">
              <strong>두 번째 설치 브라켓 <span style="color:var(--warning);font-size:12px;">별도 구매 필요</span></strong>
              <p>창틀 깊이가 2cm 미만이므로, 그 외 모델은 두 번째 설치 브라켓을 별도 구매해야 합니다.</p>
            </div>
          </div>
        `;
      } else {
        kitList.innerHTML = `
          <div class="kit-item">
            <div class="kit-icon" style="background:var(--success-light);">
              <i class="fas fa-check-circle" style="color:var(--success);"></i>
            </div>
            <div class="kit-text">
              <strong>추가 키트 불필요</strong>
              <p>현재 조건에서는 기본 구성품만으로 설치 가능합니다.</p>
            </div>
          </div>
        `;
      }
    }

    /* ── 호환 모델 ── */
    const modelList = document.getElementById('modelList');
    if (modelList) {
      const dualKit = PRODUCTS.dual_inverter;
      const premiumKit = PRODUCTS.premium;
      modelList.innerHTML = `
        <div style="margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;color:var(--gray-600);margin-bottom:8px;">
            <i class="fas fa-tag" style="color:var(--primary);margin-right:6px;"></i>
            듀얼인버터 추가 키트 호환 모델
          </div>
          <div class="model-tags">
            ${dualKit.models.map(m => `<span class="model-tag ${result.kitType === 'dual_inverter' ? 'model-tag-highlight' : ''}">${m}</span>`).join('')}
          </div>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--gray-600);margin-bottom:8px;">
            <i class="fas fa-tag" style="color:var(--primary);margin-right:6px;"></i>
            프리미엄 추가 키트 호환 모델
          </div>
          <div class="model-tags">
            ${premiumKit.models.map(m => `<span class="model-tag ${result.kitType === 'premium' ? 'model-tag-highlight' : ''}">${m}</span>`).join('')}
          </div>
        </div>
      `;
    }

    /* ── 특이사항 ── */
    const specialSection = document.getElementById('specialSection');
    const specialList = document.getElementById('specialList');
    if (specialSection && specialList) {
      if (result.specials.length > 0) {
        specialSection.style.display = 'block';
        specialList.innerHTML = result.specials.map(sp => `
          <div class="special-item">
            <i class="fas ${sp.icon}"></i>
            <p>${sp.text}</p>
          </div>
        `).join('');
      } else {
        specialSection.style.display = 'none';
      }
    }

    /* ── 설치 방법 ── */
    const installGuide = document.getElementById('installGuide');
    if (installGuide) {
      installGuide.innerHTML = result.installSteps.map(step => `
        <div class="install-step">
          <div class="install-step-num">${step.num}</div>
          <div class="install-step-content">
            <strong>${step.title}</strong>
            <p>${step.desc}</p>
          </div>
        </div>
      `).join('');
    }
  },

  /* ─── 처음부터 다시 ─── */
  restart() {
    // 상태 초기화
    state.currentStep = 0;
    state.windowType = null;
    state.windowWidth = null;
    state.windowHeight = null;
    state.productType = null;
    state.heightRange = null;
    state.sillDepth = null;
    state.sillB = null;
    state.sillC = null;
    state.sillBCValid = false;
    state.specials = new Set();
    state.frameA = null;

    // UI 초기화
    document.querySelectorAll('.choice-card, .multi-choice-card, .range-card').forEach(el => {
      el.classList.remove('selected');
    });
    document.querySelectorAll('.text-input').forEach(el => {
      el.value = '';
      el.closest('.input-wrap')?.classList.remove('success', 'error');
    });

    // 버튼 비활성화
    ['btn-step1-next', 'btn-step2-next', 'btn-step3-next', 'btn-step4-next'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });

    // 하위 섹션 숨기기
    ['casementWarning', 'heightRangeSection', 'kitInfoBox', 'shallowSillSection', 'splitGuide', 'thickGuide', 'sillBCResult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    this.showScreen(0);
    this.showToast('처음으로 돌아왔습니다.');
  },

  /* ─── 결과 공유 ─── */
  printResult() {
    if (navigator.share) {
      navigator.share({
        title: '창문형 에어컨 설치 안내 결과',
        text: '창문형 에어컨 설치 가능 여부를 확인해 보세요!',
        url: window.location.href
      }).catch(() => {});
    } else {
      // 클립보드에 URL 복사
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.showToast('링크가 클립보드에 복사되었습니다.');
        });
      } else {
        this.showToast('브라우저에서 공유 기능을 지원하지 않습니다.');
      }
    }
  },

  /* ─── 토스트 메시지 ─── */
  showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
};

/* ─── 앱 시작 ─── */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
