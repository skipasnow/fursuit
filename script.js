// ==========================================
// 1. PAW TRAIL LOGIC
// ==========================================
let trailX = 0;
let trailY = 0;
let stepCount = 0;
const stepLength = 30; 
console.log("Initializing Paw Trail...");

document.addEventListener('mousemove', function(e) {
    const dist = Math.hypot(e.clientX - trailX, e.clientY - trailY);
    if (dist > stepLength) {
        createPaw(e.clientX, e.clientY, trailX, trailY);
        trailX = e.clientX;
        trailY = e.clientY;
    }
});

function createPaw(x, y, lastX, lastY) {
    const paw = document.createElement('div');
    paw.className = 'paw-trail';
    const angle = Math.atan2(y - lastY, x - lastX) * 180 / Math.PI + 90;
    stepCount++;
    const isRightFoot = stepCount % 2 === 0;
    
    paw.style.setProperty('--angle', `${angle}deg`);
    paw.style.setProperty('--flip', isRightFoot ? 1 : -1);
    paw.style.left = (x - 12) + 'px';
    paw.style.top = (y - 12) + 'px';

    document.documentElement.appendChild(paw);
    setTimeout(() => { paw.remove(); }, 1200);
}

// ==========================================
// 2. MAIN APP LOGIC
// ==========================================
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQesC2Kuwk-4S3ID4cCsCvOGM4U0DstvIoewGKQn4pZII8mkoa6fxcN18ozOO3_EkISGIkKNVngLYdN/pub?gid=131139777&single=true&output=csv";

// --- TOOLTIP LOGIC ---
const tooltipEl = document.getElementById("image-tooltip");
let currentPreviewImages = [];
let currentImageIndex = 0;
let slideshowInterval;
let hideTimeout; 
let isTooltipCentered = false; 

function displayImageInTooltip(imageUrl, forceAnimation = false) {
    if (!imageUrl) { tooltipEl.style.backgroundImage = 'none'; return; }
    const baseTransform = isTooltipCentered ? "translate(-50%, -50%)" : "";
    if (tooltipEl.style.opacity === '0' || forceAnimation) {
        const startAngle = Math.random() < 0.5 ? -5 : 5;
        tooltipEl.style.transition = 'none';
        tooltipEl.style.opacity = '0';
        tooltipEl.style.transform = `${baseTransform} rotate(${startAngle}deg) scale(0.95)`;
    }
    const img = new Image();
    img.onload = () => {
        if (tooltipEl.style.display !== 'none') {
            tooltipEl.style.backgroundImage = `url('${imageUrl}')`;
            void tooltipEl.offsetWidth; 
            tooltipEl.style.transition = 'opacity 0.25s ease-out, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            tooltipEl.style.opacity = '1';
            tooltipEl.style.transform = `${baseTransform} rotate(0deg) scale(1)`;
        }
    };
    img.src = imageUrl;
}

// HUD Helper
function updateHudHighlight(index) {
    const hudContainer = tooltipEl.querySelector('.tooltip-hud');
    if (!hudContainer) return;
    const boxes = hudContainer.children;
    for (let i = 0; i < boxes.length; i++) {
        if (i === index) boxes[i].classList.add('active');
        else boxes[i].classList.remove('active');
    }
}

// Show Tooltip (with Enable HUD Toggle)
function showTooltip(imageUrls, startIndex = 0, forceAnimation = false, enableHud = true) {
    if (!imageUrls || imageUrls.length === 0) { hideTooltip(); return; }
    
    const isContentDifferent = !currentPreviewImages.length || currentPreviewImages[0] !== imageUrls[0];

    currentPreviewImages = imageUrls;
    currentImageIndex = startIndex;
    tooltipEl.style.display = "flex"; 

    const existingHud = tooltipEl.querySelector('.tooltip-hud');
    
    if (enableHud) {
        if (isContentDifferent || !existingHud) {
            if (existingHud) existingHud.remove();
            const hud = document.createElement('div');
            hud.className = 'tooltip-hud';
            imageUrls.forEach((_, i) => {
                const box = document.createElement('div');
                box.className = 'hud-box';
                hud.appendChild(box);
            });
            tooltipEl.appendChild(hud);
        }
        updateHudHighlight(startIndex);
    } else {
        if (existingHud) existingHud.remove();
    }
    displayImageInTooltip(currentPreviewImages[currentImageIndex], forceAnimation);
}

function hideTooltip() {
    clearTimeout(hideTimeout);
    clearInterval(slideshowInterval);
    hideTimeout = setTimeout(() => {
        tooltipEl.style.opacity = '0';
        setTimeout(() => {
             if(tooltipEl.style.opacity === '0') {
                 tooltipEl.style.display = "none";
                 tooltipEl.style.backgroundImage = 'none';
                 tooltipEl.textContent = ''; 
                 currentPreviewImages = [];
                 currentImageIndex = 0;
             }
        }, 200);
    }, 50);
}

function startSlideshow() {
    clearInterval(slideshowInterval);
    if (currentPreviewImages.length > 1) {
        slideshowInterval = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % currentPreviewImages.length;
            displayImageInTooltip(currentPreviewImages[currentImageIndex], true);
        }, 2000);
    }
}

// Positioning
function centerTooltip() {
    isTooltipCentered = true;
    tooltipEl.style.top = "50%";
    tooltipEl.style.left = "50%";
    tooltipEl.style.width = "80vh"; tooltipEl.style.height = "80vh";
}
function moveTooltip(e) {
    isTooltipCentered = false;
    const tooltipSize = 200; const offset = 15; 
    const windowHeight = window.innerHeight;
    tooltipEl.style.width = tooltipSize + "px"; tooltipEl.style.height = tooltipSize + "px";
    let left = e.clientX + offset; let top = e.clientY + offset;
    if (top + tooltipSize > windowHeight) { top = e.clientY - tooltipSize - offset; }
    tooltipEl.style.left = left + "px"; tooltipEl.style.top = top + "px";
}

// Specialty Filters
let pendingSpecialtyFilters = new Set();
let appliedSpecialtyFilters = new Set();

window.addSpecialtyFilter = function(tag) {
    if(!tag) return;
    pendingSpecialtyFilters.add(tag.trim());
    updateFilterHeader();
    triggerHeaderResize(); 
}

window.removeSpecialtyFilter = function(tag) {
    pendingSpecialtyFilters.delete(tag);
    updateFilterHeader();
    triggerHeaderResize(); 
}

window.clearSpecialtyFilters = function() {
    pendingSpecialtyFilters.clear();
    appliedSpecialtyFilters.clear(); 
    updateFilterHeader();
    triggerHeaderResize();
    table.setHeaderFilterValue("specialty", []); 
}

window.applySpecialtyFilters = function() {
    appliedSpecialtyFilters = new Set(pendingSpecialtyFilters);
    table.setHeaderFilterValue("specialty", Array.from(appliedSpecialtyFilters));
    triggerHeaderResize();
}

function triggerHeaderResize() {
    if(table) {
        setTimeout(() => {
             table.columnManager.renderer.renderColumns();
             table.redraw(true);
        }, 50);
    }
}

function updateFilterHeader() {
    const container = document.getElementById('specialty-filter-container');
    if(!container) return;
    let tagsArea = container.querySelector('.tags-area');
    if (!tagsArea) {
        container.innerHTML = '';
        const input = document.createElement("input");
        input.type = "text";
        input.className = "filter-input";
        input.placeholder = "+ Type tag...";
        input.addEventListener("keydown", function(e){
            if(e.key === "Enter"){
                addSpecialtyFilter(this.value);
                this.value = "";
            }
        });
        container.appendChild(input);
        tagsArea = document.createElement("div");
        tagsArea.className = "tags-area";
        container.appendChild(tagsArea);
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'filter-actions';
        const applyBtn = document.createElement('span');
        applyBtn.className = 'filter-apply-btn';
        applyBtn.innerText = 'Apply Filter';
        applyBtn.onclick = window.applySpecialtyFilters;
        actionsDiv.appendChild(applyBtn);
        const clearBtn = document.createElement('span');
        clearBtn.className = 'filter-clear-all';
        clearBtn.innerText = 'Clear All';
        clearBtn.onclick = window.clearSpecialtyFilters;
        actionsDiv.appendChild(clearBtn);
        container.appendChild(actionsDiv);
    } 
    tagsArea.innerHTML = '';
    if (pendingSpecialtyFilters.size > 0) {
        pendingSpecialtyFilters.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'filter-tag';
            pill.innerHTML = `${tag} <span class="filter-remove" onclick="removeSpecialtyFilter('${tag}')">✕</span>`;
            tagsArea.appendChild(pill);
        });
    } else {
        tagsArea.innerHTML = '<span style="color:#666; font-size:0.8em;">No tags selected</span>';
    }
}

// Helpers
function parseImageFormula(formula) {
  if(!formula) return "";
  const match = formula.match(/=IMAGE\("(.+)"\)/);
  return match ? match[1] : formula;
}
function parsePreviewImages(urlsString) {
    if (!urlsString || typeof urlsString !== 'string') return [];
    return urlsString.split(/[\s,]+/)
        .map(url => url.trim())
        .filter(url => url.length > 0 && url.toLowerCase().startsWith('http'));
}
function cleanNumber(val) {
    if (val === null || val === undefined || val === "") return null;
    if (typeof val === 'string') {
        const cleaned = val.replace(/[$,\s]/g, '');
        if(cleaned === "") return null;
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    }
    return val; 
}
function getGradientColor(value, min, max, lowIsGreen=false){
    if(value === null || value === undefined || value === "" || isNaN(value)) return "";
    const ratio = (value - min)/(max - min);
    const cappedRatio = Math.min(Math.max(ratio,0),1);
    let r,g;
    if(lowIsGreen){
        r = Math.floor(179 * cappedRatio + 46 * (1-cappedRatio)); 
        g = Math.floor(27 * cappedRatio + 111 * (1-cappedRatio)); 
    } else {
        r = Math.floor(46 * cappedRatio + 179 * (1-cappedRatio));
        g = Math.floor(111 * cappedRatio + 27 * (1-cappedRatio));
    }
    return `rgb(${r},${g},0)`;
}
function formatTextCell(cell) {
    const val = cell.getValue();
    if(val === null || val === undefined) return "";
    return `<div class="text-wrapper"><span class="text-content">${val}</span></div>`;
}

const headerText = document.getElementById('header-text');
let starInterval;
function createStar() {
    const star = document.createElement('div');
    star.className = 'star-particle';
    star.textContent = '★';
    const startX = Math.random() * window.innerWidth;
    const headerRect = headerText.getBoundingClientRect();
    const startY = headerRect.bottom - 10; 
    star.style.left = startX + 'px'; star.style.top = startY + 'px';
    const size = 0.8 + Math.random() * 0.8;
    star.style.fontSize = size + 'em';
    document.body.appendChild(star);
    setTimeout(() => { star.remove(); }, 1500);
}
headerText.addEventListener('mouseenter', () => { starInterval = setInterval(createStar, 50); });
headerText.addEventListener('mouseleave', () => { clearInterval(starInterval); });

// --- MAIN LOGIC ---
let table;

// Helper to update the results counter text
function updateResultCounter(activeCount, totalCount) {
    const el = document.getElementById("results-counter");
    if(el) {
        el.innerHTML = `Makers matching criteria: <b>${activeCount}</b> <span style="font-size:0.8em; color:#666;">(of ${totalCount})</span>`;
    }
}

Papa.parse(csvUrl, {
    download: true, header: true, dynamicTyping: true,
    complete: function(results) {
        const data = results.data.map(row => ({
            rank: cleanNumber(row['Rank']),
            maker: row['Maker'],
            logo: parseImageFormula(row['Logo']),
            makerType: row['Maker Type'],
            link: row['Link'],
            previewImages: parsePreviewImages(row['Preview']), 
            price: cleanNumber(row['$ Price']),
            shipOrFly: cleanNumber(row['$ Ship or Fly']),
            tariff: cleanNumber(row['$ Tariff (2025)']),
            ship: cleanNumber(row['$ Ship']),
            airTravel: cleanNumber(row['$ Air Travel']),
            travelSurplus: cleanNumber(row['$ Travel Surplus']),
            aesthetic: row['Aesthetic'],
            status: row['Status'],
            specialty: row['Specialty'],
            partials: cleanNumber(row['Partials']),
            fursuits: cleanNumber(row['Fursuits']),
            portfolio: cleanNumber(row['Portfolio Size']),
            country: row['Country'],
            followers: cleanNumber(row['Followers']), 
            acctAge: cleanNumber(row['Acct Age']),
            acctDate: row['Acct Date'],
            rep: row['Rep'],
            timeline: row['Timeline'],
            rankScore: cleanNumber(row['Rank Score']),
            imperfections: cleanNumber(row['Imperfections']),
            worksPerYear: cleanNumber(row['Works Per Year']),
            worksRank: cleanNumber(row['Works Rank']),
            followersRank: cleanNumber(row['Followers Rank']),
            acctDateRank: cleanNumber(row['Acct Date Rank']),
            partialsRank: cleanNumber(row['Partials Rank']),
            fursuitsRank: cleanNumber(row['Fursuits Rank']),
            priceRank: cleanNumber(row['Price Rank']),
        })).filter(row => row.maker); 

        if (data.length === 0) { console.warn("Data array is empty."); return; }

        const colMinMax = {};
        const gradientColumns = ['price','partials','fursuits','portfolio','acctAge','followers'];
        gradientColumns.forEach(col=>{
            const vals = data.map(d=>d[col]).filter(v=>v!==null && v!=="" && !isNaN(v));
            colMinMax[col] = {min: Math.min(...vals), max: Math.max(...vals)};
        });

        // --- TABULATOR INIT ---
        table = new Tabulator("#creator-table", {
            data: data,
            layout: "fitData",
            movableColumns: true,
            resizableColumns: true,
            placeholder:"No Data Available",
            height:"100%", 
            initialSort:[ {column:"rank", dir:"asc"} ],
            
            // --- COUNTER EVENTS (FIXED) ---
            dataFiltered: function(filters, rows) {
                // We use 'this.getDataCount' to ensure accuracy regardless of Virtual DOM state
                const active = this.getDataCount("active");
                const total = this.getDataCount();
                updateResultCounter(active, total);
            },

            // --- INITIALIZE SLIDER AFTER TABLE IS BUILT (FIXED) ---
            tableBuilt: function() {
                // Capture the table instance to avoid "undefined" errors
                const tableInstance = this;

                // 1. Initial Count Update
                updateResultCounter(data.length, data.length);

                // 2. Slider Initialization
                const slider = document.getElementById('price-slider');
                const priceLabel = document.getElementById('price-values');
                const naCheckbox = document.getElementById('show-na-prices');
                const resetPriceBtn = document.getElementById('reset-price-btn');

                if (slider && typeof noUiSlider !== 'undefined') {
                    noUiSlider.create(slider, {
                        start: [2000, 10000], 
                        connect: true,        
                        range: { 'min': 2000, 'max': 10000 },
                        step: 500,            
                        tooltips: false, 
                        pips: {
                            mode: 'steps',
                            density: 6.25,
                            filter: function (value, type) {
                                if (value % 2000 === 0) return 1; 
                                return 0; 
                            },
                            format: {
                                to: function (value) { return '$' + (value / 1000) + 'k'; }
                            }
                        },
                        format: {
                            to: function (value) { return Math.round(value); },
                            from: function (value) { return Number(value); }
                        }
                    });

                    const updateTableFilter = () => {
                        const values = slider.noUiSlider.get();
                        const min = parseInt(values[0]);
                        const max = parseInt(values[1]);
                        const showNA = naCheckbox.checked;

                        priceLabel.innerText = `$${min.toLocaleString()} - $${max.toLocaleString()}`;

                        // CRITICAL FIX: Use 'tableInstance' instead of global 'table'
                        tableInstance.setFilter(function(row){ 
                            if (typeof row.price !== 'number') {
                                return showNA; 
                            }
                            return row.price >= min && row.price <= max;
                        });
                    };

                    // Bind Events
                    slider.noUiSlider.on('update', updateTableFilter);
                    naCheckbox.addEventListener('change', updateTableFilter);
                    
                    if(resetPriceBtn) {
                        resetPriceBtn.addEventListener('click', function(){
                            slider.noUiSlider.set([2000, 10000]);
                            naCheckbox.checked = true;
                            // Manually trigger update
                            const values = slider.noUiSlider.get(); 
                            priceLabel.innerText = `$${parseInt(values[0]).toLocaleString()} - $${parseInt(values[1]).toLocaleString()}`;
                            tableInstance.recalc(); 
                            updateTableFilter(); 
                        });
                    }

                    // Global Reset Hook
                    document.getElementById("reset-sort").addEventListener("click", function(){
                        tableInstance.clearSort(); 
                        tableInstance.setSort("rank", "asc"); 
                        tableInstance.clearHeaderFilter(); 
                        document.getElementById("sort-field").value = "rank";
                        document.getElementById("sort-dir").value = "asc";
                        window.clearSpecialtyFilters(); 
                        
                        slider.noUiSlider.set([2000, 10000]);
                        naCheckbox.checked = true;
                        updateTableFilter();
                    });
                }
            },

            columns: [
                { title:"Rank", field:"rank", width:80, hozAlign:"center", sorter:"number", formatter: formatTextCell, cssClass: "text-cell" },
                { title:"Maker", field:"maker", formatter: formatTextCell, cssClass: "text-cell" },
                {
                    title:"Logo", field:"logo", hozAlign:"center", width:90, 
                    formatter:function(cell){
                        const val = cell.getValue();
                        return val ? `<div class="logo-box" style="background-image:url('${val}');"></div>` : "";
                    }
                },
                { title:"Maker Type", field:"makerType", formatter: formatTextCell, cssClass: "text-cell" },
                {
                    title:"Link", field:"link", formatter:"link", hozAlign:"center",
                    formatterParams:{ labelField:"link", urlField:"link", target:"_blank" }
                },
                {
                    title: "Preview", 
                    field: "previewImages", 
                    hozAlign: "center", 
                    width: 200,
                    formatter: function(cell) {
                        const imageUrls = cell.getValue();
                        if (!imageUrls || imageUrls.length === 0) return "";
                        const container = document.createElement('div');
                        container.className = 'preview-container';
                        
                        imageUrls.forEach((url, index) => {
                            const previewBox = document.createElement('div');
                            previewBox.className = 'preview-box';
                            const thumbUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=60&h=60&output=webp&q=80`;
                            previewBox.style.backgroundImage = `url('${thumbUrl}')`;
                            previewBox.style.backgroundSize = "cover";
                            previewBox.style.backgroundPosition = "center";
                            previewBox.setAttribute('data-image-index', index);
                            previewBox.dataset.src = url; 
                            container.appendChild(previewBox);
                        });

                        const updateScrub = (e) => {
                            if(e.cancelable) e.preventDefault(); 
                            const rect = container.getBoundingClientRect();
                            const touch = e.touches[0];
                            const touchX = touch.clientX - rect.left;
                            let percent = touchX / rect.width;
                            percent = Math.max(0, Math.min(1, percent)); 
                            const totalImages = imageUrls.length;
                            const index = Math.floor(percent * totalImages);
                            const clampedIndex = Math.min(totalImages - 1, index);

                            centerTooltip(); 
                            showTooltip(imageUrls, clampedIndex, false, true);
                            
                            const boxes = container.querySelectorAll('.preview-box');
                            boxes.forEach(b => b.style.borderColor = ''); 
                            if(boxes[clampedIndex]) boxes[clampedIndex].style.borderColor = 'darkorange';
                            
                            updateHudHighlight(clampedIndex); 
                        };

                        container.addEventListener('touchstart', (e) => { updateScrub(e); }, {passive: false});
                        container.addEventListener('touchmove', (e) => { updateScrub(e); }, {passive: false});
                        container.addEventListener('touchend', (e) => {
                            const boxes = container.querySelectorAll('.preview-box');
                            boxes.forEach(b => b.style.borderColor = ''); 
                        });
                        return container;
                    },
                },
                {
                    title:"$ Price", field:"price", hozAlign:"right", sorter:"number",
                    sorterParams:{ alignEmptyValues:"bottom" },
                    formatter:function(cell){
                        const val = cell.getValue();
                        if(val === null) return "N/A"; 
                        const c = getGradientColor(val,colMinMax['price'].min,colMinMax['price'].max,true);
                        cell.getElement().style.backgroundColor = c;
                        cell.getElement().style.color="#fff";
                        return val;
                    }
                },
                { title:"$ Ship or Fly", field:"shipOrFly", hozAlign:"right", sorter:"number", sorterParams:{ alignEmptyValues:"bottom" }, formatter: formatTextCell, cssClass: "text-cell" },
                { title:"$ Tariff (2025)", field:"tariff", hozAlign:"right", sorter:"number", sorterParams:{ alignEmptyValues:"bottom" }, formatter: formatTextCell, cssClass: "text-cell" },
                { title:"$ Ship", field:"ship", hozAlign:"right", sorter:"number", sorterParams:{ alignEmptyValues:"bottom" }, formatter: formatTextCell, cssClass: "text-cell" },
                { title:"$ Air Travel", field:"airTravel", hozAlign:"right", sorter:"number", sorterParams:{ alignEmptyValues:"bottom" }, formatter: formatTextCell, cssClass: "text-cell" },
                { title:"$ Travel Surplus", field:"travelSurplus", hozAlign:"right", sorter:"number", sorterParams:{ alignEmptyValues:"bottom" }, formatter: formatTextCell, cssClass: "text-cell" },
                { title:"Aesthetic", field:"aesthetic", formatter: formatTextCell, cssClass: "text-cell" },
                { title:"Status", field:"status", formatter: formatTextCell, cssClass: "text-cell" },
                {
                    title:"Specialty", 
                    field:"specialty", 
                    width: 300,
                    headerFilter: function(cell, onRendered, success, cancel, editorParams){
                        const container = document.createElement("div");
                        container.id = "specialty-filter-container";
                        container.className = "filter-container";
                        setTimeout(updateFilterHeader, 100); 
                        return container;
                    },
                    headerFilterFunc: function(headerValue, rowValue, rowData, filterParams){
                        if (!headerValue || headerValue.length === 0) return true;
                        if (!rowValue) return false;
                        const rowTags = rowValue.split(',').map(t => t.trim());
                        let match = false;
                        headerValue.forEach(filterTag => {
                            if (rowTags.includes(filterTag)) match = true;
                        });
                        return match;
                    },
                    formatter: function(cell) {
                        const val = cell.getValue();
                        if (!val) return "";
                        const tags = val.split(',').map(t => t.trim()).filter(t => t);
                        const wrapper = document.createElement('div');
                        wrapper.className = 'tag-wrapper';
                        tags.forEach(tag => {
                            const span = document.createElement('span');
                            span.className = 'specialty-tag';
                            span.textContent = tag;
                            span.onclick = function(e) {
                                e.stopPropagation(); 
                                window.addSpecialtyFilter(tag);
                            };
                            wrapper.appendChild(span);
                        });
                        return wrapper;
                    }
                },
                {
                    title:"Partials", field:"partials", hozAlign:"right", sorter:"number",
                    sorterParams:{ alignEmptyValues:"bottom" },
                    formatter:function(cell){
                        const val = cell.getValue();
                        if(val === null) return "";
                        const c = getGradientColor(val,colMinMax['partials'].min,colMinMax['partials'].max,false);
                        cell.getElement().style.backgroundColor = c;
                        cell.getElement().style.color="#fff";
                        return val;
                    }
                },
                {
                    title:"Fursuits", field:"fursuits", hozAlign:"right", sorter:"number",
                    sorterParams:{ alignEmptyValues:"bottom" },
                    formatter:function(cell){
                        const val = cell.getValue();
                        if(val === null) return "";
                        const c = getGradientColor(val,colMinMax['fursuits'].min,colMinMax['fursuits'].max,false);
                        cell.getElement().style.backgroundColor = c;
                        cell.getElement().style.color="#fff";
                        return val;
                    }
                },
                {
                    title:"Portfolio Size", field:"portfolio", hozAlign:"right", sorter:"number",
                    sorterParams:{ alignEmptyValues:"bottom" },
                    formatter:function(cell){
                        const val = cell.getValue();
                        if(val === null) return "";
                        const c = getGradientColor(val,colMinMax['portfolio'].min,colMinMax['portfolio'].max,false);
                        cell.getElement().style.backgroundColor = c;
                        cell.getElement().style.color="#fff";
                        return val;
                    }
                },
                { title:"Country", field:"country", formatter: formatTextCell, cssClass: "text-cell" },
                {
                    title:"Followers", field:"followers", hozAlign:"right", sorter:"number",
                    sorterParams:{ alignEmptyValues:"bottom" },
                    formatter:function(cell){
                        const val = cell.getValue();
                        if(val === null) return "";
                        const displayVal = val.toLocaleString(); 
                        const c = getGradientColor(val,colMinMax['followers'].min,colMinMax['followers'].max,false);
                        cell.getElement().style.backgroundColor = c;
                        cell.getElement().style.color="#fff";
                        return displayVal;
                    }
                },
                {
                    title:"Acct Age", field:"acctAge", hozAlign:"right", sorter:"number",
                    sorterParams:{ alignEmptyValues:"bottom" }, 
                    formatter:function(cell){
                        const val = cell.getValue();
                        if(val === null) return "";
                        const c = getGradientColor(val,colMinMax['acctAge'].min,colMinMax['acctAge'].max,false);
                        cell.getElement().style.backgroundColor = c;
                        cell.getElement().style.color="#fff";
                        return val;
                    }
                },
                { title:"Acct Date", field:"acctDate", formatter: formatTextCell, cssClass: "text-cell" }
            ],
            rowFormatter:function(row){
                const el = row.getElement();
                if(row.getIndex()%2===0) el.style.backgroundColor="#383838";
                else el.style.backgroundColor="#2e2e2e";
            },
            reactiveData:true, virtualDom:true
        });

        document.getElementById("sort-field").addEventListener("change", function(){
             const field = this.value; const dir = document.getElementById("sort-dir").value; table.setSort(field, dir);
        });
        document.getElementById("sort-dir").addEventListener("change", function(){
             const field = document.getElementById("sort-field").value; const dir = this.value; table.setSort(field, dir);
        });
    }
});

// --- GLOBAL HOVER TRACKING ---
let lastTiltCell = null; 
document.addEventListener('mousemove', (e) => {
    const target = e.target;
    const isOverPreview = target.closest('.preview-box');
    const isOverLogo = target.closest('.logo-box'); 
    const isOverTooltip = target.closest('#image-tooltip');
    
    // PART 1: REACTIVE TILT
    const cell = target.closest('.tabulator-cell');
    if (lastTiltCell && lastTiltCell !== cell) {
        const oldWrapper = lastTiltCell.querySelector('.text-wrapper');
        if (oldWrapper) oldWrapper.style.transform = '';
        lastTiltCell.style.transform = 'none';
        lastTiltCell.classList.remove('active-tilt');
        lastTiltCell = null;
    }
    if (cell) {
        lastTiltCell = cell;
        cell.classList.add('active-tilt');
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        const rotateX = -1 * (mouseY / (rect.height / 2)) * 10; 
        const rotateY = (mouseX / (rect.width / 2)) * 10;
        const wrapper = cell.querySelector('.text-wrapper');
        const transformString = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
        
        if (wrapper) { wrapper.style.transform = `translateY(-50%) ${transformString}`; } 
        else if (!cell.querySelector('a') && !cell.querySelector('.tag-wrapper')) { 
             cell.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        }
    }

    // PART 2: TOOLTIP
    const sourceBox = isOverPreview || isOverLogo;
    if (sourceBox) {
        clearTimeout(hideTimeout);
        const rowEl = target.closest('.tabulator-row');
        if (rowEl && table) {
            const row = table.getRow(rowEl);
            if (row) {
                const rowData = row.getData();
                let imageUrls = []; let index = 0; let isLogo = false;
                
                if (isOverPreview) {
                    imageUrls = rowData.previewImages;
                    index = parseInt(sourceBox.getAttribute('data-image-index'), 10);
                    isLogo = false;
                } else if (isOverLogo) {
                    imageUrls = [rowData.logo]; index = 0; isLogo = true;
                }
                
                if (imageUrls && imageUrls.length > 0) {
                    const isNewContent = (currentPreviewImages[0] !== imageUrls[0] || currentPreviewImages.length !== imageUrls.length);
                    if (tooltipEl.style.display === 'none' || isNewContent || currentImageIndex !== index || isLogo) {
                        const shouldAnimate = (isNewContent || currentImageIndex !== index);
                        if (isLogo) {
                            clearInterval(slideshowInterval); 
                            moveTooltip(e); 
                            if (tooltipEl.style.display === 'none' || isNewContent) { showTooltip(imageUrls, index, true, false); }
                        } else {
                            clearInterval(slideshowInterval); 
                            centerTooltip(); 
                            if (isNewContent || currentImageIndex !== index) { 
                                showTooltip(imageUrls, index, shouldAnimate, true); 
                                updateHudHighlight(index); 
                            } 
                            else { 
                                tooltipEl.style.display = "flex"; 
                            }
                        }
                    }
                }
            }
        }
    } else if (!isOverTooltip && tooltipEl.style.display !== 'none') { hideTooltip(); }
});