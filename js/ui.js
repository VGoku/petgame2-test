// ui.js
// DOM references
const coinCountEl = document.getElementById("coinCount");
const dustCountEl = document.getElementById("dustCount");
const playerLevelEl = document.getElementById("playerLevel");
const playerXPEl = document.getElementById("playerXP");
const serverTimeEl = document.getElementById("serverTime");
const notificationEl = document.getElementById("notification");
const hatchingOverlay = document.getElementById("hatching-overlay");
const bgMusicEl = document.getElementById('bg-music');

function updateUI() {
  if (coinCountEl) coinCountEl.textContent = gameState.coins ?? 0;
  if (dustCountEl) dustCountEl.textContent = gameState.dust ?? 0;
  if (playerLevelEl) playerLevelEl.textContent = gameState.level ?? 1;
  if (playerXPEl) playerXPEl.textContent = gameState.xp ?? 0;

  // Update XP progress bar if present
  const xpBar = document.getElementById('playerXPBar');
  if (xpBar) {
    // Use same XP formula as game.js getRequiredXP (100 * 2^(level-1))
    const lvl = Number(gameState.level) || 1;
    const req = Math.floor(100 * Math.pow(2, lvl - 1));
    const xp = Number(gameState.xp) || 0;
    const pct = Math.max(0, Math.min(100, Math.round((xp / req) * 100)));
    xpBar.style.width = pct + '%';
    xpBar.title = `${xp} / ${req} XP`;
  }
  
  // Update active familiar display
  const activeFamiliarDisplay = document.getElementById('activeFamiliarDisplay');
  if (activeFamiliarDisplay) {
    const activeFamiliar = getActiveFamiliar();
    if (activeFamiliar) {
      activeFamiliarDisplay.textContent = `Active: ${activeFamiliar.name}`;
    } else {
      activeFamiliarDisplay.textContent = 'Active: None';
    }
  }
}

function updateServerTime() {
  if (!serverTimeEl) return;
  const now = new Date();
  serverTimeEl.textContent = now.toLocaleTimeString();
}

function showSection(sectionName) {
  if (!sectionName) return;
  document.body.className = sectionName;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(sectionName);
  if (target) target.classList.add('active');

  const btn = document.getElementById(`btn-${sectionName}`);
  if (btn) btn.classList.add('active');
}

function showNotification(msg, duration = 2000) {
  if (!notificationEl) return;
  notificationEl.textContent = msg;
  notificationEl.classList.add('show');
  setTimeout(() => notificationEl.classList.remove('show'), duration);
}

function spawnOrb(targetEl, count = 1) {
  if (!targetEl) return;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const orb = document.createElement('div');
      orb.className = 'orb';
      orb.style.left = Math.random() * window.innerWidth + 'px';
      orb.style.top = Math.random() * window.innerHeight + 'px';
      document.body.appendChild(orb);
      setTimeout(() => {
        const rect = targetEl.getBoundingClientRect();
        orb.style.transition = 'all 900ms ease-out';
        orb.style.left = (rect.left + rect.width / 2) + 'px';
        orb.style.top = (rect.top + rect.height / 2) + 'px';
        orb.style.opacity = '0';
        orb.style.transform = 'scale(0.2)';
      }, 80);
      setTimeout(() => orb.remove(), 1200);
    }, i * 150);
  }
}

function showHatchingAnimation(cb) {
  if (!hatchingOverlay) { if (typeof cb === 'function') cb(); return; }
  hatchingOverlay.classList.remove('hidden');
  hatchingOverlay.innerHTML = '<div class="egg-container"><div class="egg wobble"></div></div>';
  setTimeout(() => {
    hatchingOverlay.classList.add('hidden');
    if (typeof cb === 'function') cb();
  }, 1800);
}

/* ---------- Image resolution helper ---------- */
function getImageSrc(item, fallbackType = 'familiar') {
  if (!item) return (fallbackType === 'enemy' ? enemyImages.default : familiarImages.default);
  if (item.image) return item.image;
  if (item.img) return item.img;
  const key = (item.species || item.name || '').toString().toLowerCase().replace(/\s+/g, '-');
  if (fallbackType === 'enemy' && window.enemyImages && window.enemyImages[key]) return window.enemyImages[key];
  if (window.familiarImages && window.familiarImages[key]) return window.familiarImages[key];
  return (fallbackType === 'enemy' ? enemyImages.default : familiarImages.default);
}

// Enhanced image loading with better error handling
function createImageElement(src, alt = '', className = '', onError = null) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  if (className) img.className = className;
  
  // Enhanced error handling
  img.onerror = function() {
    console.warn(`Failed to load image: ${src}`);
    if (onError) {
      onError(img);
    } else {
      // Default fallback behavior
      const fallbackSrc = src && src.toString().includes('familiars') ? 'img/familiars/familiars.png' : 
                         (src && src.toString().includes('enemies') ? 'img/assets/battle.png' : 'img/assets/crate.png');
      img.src = fallbackSrc;
      img.onerror = null; // Prevent infinite loop
    }
  };
  
  return img;
}

/* ---------- Render familiars (clean layout, rename support) ---------- */
function renderFamiliars() {
  const container = document.getElementById('familiarContainer');
  if (!container) return;
  container.innerHTML = '';

  (gameState.familiars || []).forEach(fam => {
    const key = (fam.species || fam.name || 'familiar').toString().toLowerCase().replace(/\s+/g, '-');
    const imgSrc = getImageSrc(fam, 'familiar');
  const placeholder = (familiarImages && familiarImages.default) || 'img/familiars/familiars.png';

    const div = document.createElement('div');
    div.className = 'card familiar-card';
    div.dataset.familiarId = fam.id;
    div.onclick = () => showFamiliarDetail(fam.id);

    // Stats layout: left = needs, right = core stats
    const cardImageDiv = document.createElement('div');
    cardImageDiv.className = 'card-image';
    
    const img = createImageElement(imgSrc, fam.name, 'familiar-thumb', (errorImg) => {
      errorImg.src = placeholder;
    });
    
    cardImageDiv.appendChild(img);
    
    div.appendChild(cardImageDiv);
    
    // Add name and level
    const nameEl = document.createElement('h3');
    nameEl.className = 'fam-name';
    nameEl.textContent = fam.name || 'Unnamed';
    div.appendChild(nameEl);
    
    const levelEl = document.createElement('p');
    levelEl.className = 'fam-level';
    levelEl.textContent = `Level ${fam.level || 1} ${fam.species ? '(' + fam.species + ')' : ''}`;
    // Add per-familiar XP bar
    try {
      const reqXP = (typeof getRequiredXP === 'function') ? getRequiredXP(fam.level || 1) : (100 * Math.pow(2, (fam.level || 1) - 1));
      const famXP = Number(fam.xp) || 0;
      const pct = Math.max(0, Math.min(100, Math.round((famXP / reqXP) * 100)));

      const xpContainer = document.createElement('div');
      xpContainer.style.cssText = 'margin-top:8px;text-align:left;';
      xpContainer.innerHTML = `
        <div style="font-size:12px;color:#c8bda1;margin-bottom:4px;">XP: ${famXP} / ${reqXP}</div>
        <div class="progress-bar" style="height:10px;">
          <div class="progress-fill" style="width: ${pct}%; height:100%;"></div>
        </div>
      `;
      levelEl.appendChild(xpContainer);
    } catch (e) { /* ignore if function not available */ }
    div.appendChild(levelEl);
    
    // Add stats grid
    const statsGrid = document.createElement('div');
    statsGrid.className = 'fam-stats-grid';
    statsGrid.innerHTML = `
      <div class="stat"><span>❤️</span> <span>${fam.happiness ?? 0}%</span></div>
      <div class="stat"><span>⚔️</span> <span>${fam.attack ?? 0}</span></div>
      <div class="stat"><span>🍖</span> <span>${fam.hunger ?? 0}%</span></div>
      <div class="stat"><span>🛡️</span> <span>${fam.defense ?? 0}</span></div>
      <div class="stat"><span>💧</span> <span>${fam.thirst ?? 0}%</span></div>
      <div class="stat"><span>⚡</span> <span>${fam.speed ?? 0}</span></div>
    `;
    div.appendChild(statsGrid);
    
    // Add action buttons
    const actionsDiv1 = document.createElement('div');
    actionsDiv1.className = 'familiar-actions';
    actionsDiv1.innerHTML = `
      <button class="btn" onclick="interactFamiliar(${fam.id}, 'play')">Play</button>
      <button class="btn" onclick="interactFamiliar(${fam.id}, 'feed')">Feed</button>
      <button class="btn" onclick="interactFamiliar(${fam.id}, 'water')">Water</button>
      <button class="btn btn-primary" onclick="startBattle(${fam.id})">Battle</button>
    `;
    div.appendChild(actionsDiv1);
    
    const actionsDiv2 = document.createElement('div');
    actionsDiv2.className = 'familiar-actions';
    
    // Check if this is the active familiar
    const isActive = gameState.activeFamiliarId === fam.id;
    const activeText = isActive ? '⭐ Active Pet' : 'Set Active';
    
    actionsDiv2.innerHTML = `
      <button class="btn" onclick="setActiveFamiliar(${fam.id})">${activeText}</button>
      <button class="btn" onclick="renameFamiliar(${fam.id})">Rename</button>
      <button class="btn" onclick="sendToPound(${fam.id})">Send to Pound</button>
    `;
    div.appendChild(actionsDiv2);
    
    // Add visual indicator for active familiar
    if (isActive) {
      div.style.border = '3px solid #ffd700';
      div.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
    }
    
    // Add library and collection info
    const libraryCount = fam.library ? fam.library.length : 0;
    const stampCount = fam.collectibles ? fam.collectibles.stamps.length : 0;
    const toyCount = fam.collectibles ? fam.collectibles.toys.length : 0;
    const plantCount = fam.collectibles ? fam.collectibles.plants.length : 0;
    
    const collectionDiv = document.createElement('div');
    collectionDiv.style.cssText = 'margin-top: 10px; font-size: 12px; color: #c8bda1;';
    collectionDiv.innerHTML = `
      📚 Books: ${libraryCount} | 🎫 Stamps: ${stampCount} | 🧸 Toys: ${toyCount} | 🌸 Plants: ${plantCount}
    `;
    div.appendChild(collectionDiv);

    container.appendChild(div);
  });
}

function closeFamiliarDetailModal() {
  const modal = document.getElementById('familiar-detail-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showFamiliarDetail(familiarId) {
  const familiar = gameState.familiars.find(f => f.id === familiarId);
  if (!familiar) return;

  const modal = document.getElementById('familiar-detail-modal');
  const content = document.getElementById('familiar-detail-content');
  if (!modal || !content) return;

  let libraryHtml = '<h4>Books</h4>';
  if (familiar.library && familiar.library.length > 0) {
    libraryHtml += '<ul>';
    familiar.library.forEach(book => {
      libraryHtml += `<li><strong>${book.title}</strong>: ${book.description} (Read on: ${book.dateRead})</li>`;
    });
    libraryHtml += '</ul>';
  } else {
    libraryHtml += '<p>No books read yet.</p>';
  }

  let collectiblesHtml = '<h4>Collectibles</h4>';
  if (familiar.collectibles) {
    for (const category in familiar.collectibles) {
      collectiblesHtml += `<h5>${category.charAt(0).toUpperCase() + category.slice(1)}</h5>`;
      if (familiar.collectibles[category].length > 0) {
        collectiblesHtml += '<ul>';
        familiar.collectibles[category].forEach(item => {
          collectiblesHtml += `<li><strong>${item.name}</strong>: ${item.description} (Collected on: ${item.dateCollected})</li>`;
        });
        collectiblesHtml += '</ul>';
      } else {
        collectiblesHtml += `<p>No ${category} collected yet.</p>`;
      }
    }
  }

  content.innerHTML = `
    <h2>${familiar.name}</h2>
    <img src="${getImageSrc(familiar)}" alt="${familiar.name}" style="width: 128px; height: 128px; border-radius: 50%;">
    <p>Level ${familiar.level} ${familiar.species}</p>
    ${libraryHtml}
    ${collectiblesHtml}
  `;

  modal.style.display = 'flex';
}

/* ---------- Inventory & Shop ---------- */
function renderInventory() {
  const container = document.getElementById('inventoryContainer');
  if (!container) return;
  container.innerHTML = '';
  const inv = gameState.inventory || [];
  const visibleInv = (inv || []).filter(i => (i.quantity || 0) > 0);
  if (!visibleInv.length) { container.innerHTML = '<p>Your inventory is empty.</p>'; return; }

  visibleInv.forEach(item => {
    console.log("Rendering inventory item with image:", item.image);
    const div = document.createElement('div');
    div.className = 'card item-card';
    
    const cardImageDiv = document.createElement('div');
    cardImageDiv.className = 'card-image';
    
    if (item.image) {
      const img = createImageElement(item.image, item.name, '', (errorImg) => {
        errorImg.src = IMG_PATHS.shop;
      });
      img.style.width = '64px';
      img.style.height = '64px';
      cardImageDiv.appendChild(img);
    }
    
    div.appendChild(cardImageDiv);
    
    const nameEl = document.createElement('h3');
    nameEl.textContent = item.name;
    div.appendChild(nameEl);
    
    if (item.description) {
      const descEl = document.createElement('p');
      descEl.textContent = item.description;
      div.appendChild(descEl);
    }
    
    const qtyEl = document.createElement('p');
    qtyEl.textContent = `Qty: ${item.quantity || 0}`;
    div.appendChild(qtyEl);
    
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = item.type === 'egg' ? 'Hatch' : 'Use';
    btn.onclick = () => item.type === 'egg' ? hatchEgg(item.id) : useItem(item.id);
    div.appendChild(btn);
    
    container.appendChild(div);
  });
}

function showBuyQuantityDialog(itemId) {
  console.log("showBuyQuantityDialog called for", itemId);
  
  const item = shopItems.find(i => i.id === itemId);
  if (!item) {
    showNotification('Item not found');
    return;
  }

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'buy-quantity-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  // Create modal content
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: rgba(42, 14, 58, 0.95);
    border: 2px solid #ffd700;
    padding: 20px;
    max-width: 400px;
    color: #fff;
    text-align: center;
  `;

  const maxAffordable = Math.floor((gameState[item.currency] || 0) / item.price);
  const maxQuantity = Math.min(maxAffordable, 99); // Cap at 99 for UI reasons

  dialog.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      ${item.image ? `<img src="${item.image}" style="width: 64px; height: 64px; margin-right: 15px; border-radius: 8px;" alt="${item.name}">` : ''}
      <div>
        <h3 style="margin: 0 0 10px 0; color: #ffd700;">${item.name}</h3>
        <p style="margin: 0; color: #c8bda1;">${item.description || ''}</p>
      </div>
    </div>
    
    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 5px 0; font-size: 16px;"><strong>Price:</strong> ${item.price} ${item.currency === 'coins' ? '🪙 Coins' : '✨ Dust'} each</p>
      <p style="margin: 5px 0; color: #90EE90;"><strong>You can afford:</strong> ${maxQuantity} ${maxQuantity === 1 ? 'item' : 'items'}</p>
      <p style="margin: 5px 0; color: #FFD700;"><strong>Your ${item.currency}:</strong> ${gameState[item.currency] || 0}</p>
    </div>
    
    <div style="margin: 20px 0;">
      <label for="quantity-input" style="display: block; margin-bottom: 10px; font-weight: bold;">Quantity to buy:</label>
      <input type="number" id="quantity-input" min="1" max="${maxQuantity}" value="1" style="
        width: 100px;
        padding: 8px;
        background: #2a0e3a;
        color: #fff;
        border: 2px solid #ffd700;
        border-radius: 6px;
        font-size: 16px;
        text-align: center;
      ">
      <div id="total-cost" style="margin-top: 10px; font-size: 18px; color: #ffd700; font-weight: bold;">
        Total Cost: ${item.price} ${item.currency === 'coins' ? '🪙' : '✨'}
      </div>
    </div>
    
    <div style="margin: 20px 0;">
      <button onclick="confirmBuy(${itemId})" style="
        background: linear-gradient(45deg, #2a0e3a, #4a1a5a);
        color: #ffd700;
        border: 2px solid #ffd700;
        padding: 12px 24px;
        margin: 0 8px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
      " onmouseover="this.style.background='linear-gradient(45deg, #4a1a5a, #6a2a7a)'" onmouseout="this.style.background='linear-gradient(45deg, #2a0e3a, #4a1a5a)'">Buy Now</button>
      <button onclick="closeBuyQuantityDialog()" style="
        background: #2a0e3a;
        color: #ffd700;
        border: 2px solid #ffd700;
        padding: 12px 24px;
        margin: 0 8px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
      " onmouseover="this.style.background='#4a1a5a'" onmouseout="this.style.background='#2a0e3a'">Cancel</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Focus on quantity input and add real-time cost calculation
  setTimeout(() => {
    const input = document.getElementById('quantity-input');
    const totalCostEl = document.getElementById('total-cost');
    
    if (input) {
      input.focus();
      
      // Add real-time cost calculation
      input.addEventListener('input', () => {
        const quantity = parseInt(input.value) || 1;
        const totalCost = item.price * quantity;
        const currencySymbol = item.currency === 'coins' ? '🪙' : '✨';
        
        if (totalCostEl) {
          totalCostEl.innerHTML = `Total Cost: ${totalCost} ${currencySymbol}`;
          
          // Change color based on affordability
          if (totalCost > (gameState[item.currency] || 0)) {
            totalCostEl.style.color = '#ff6b6b';
          } else {
            totalCostEl.style.color = '#ffd700';
          }
        }
      });
    }
  }, 100);
}

function closeBuyQuantityDialog() {
  const overlay = document.getElementById('buy-quantity-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function confirmBuy(itemId) {
  const quantityInput = document.getElementById('quantity-input');
  const quantity = parseInt(quantityInput.value) || 1;
  
  console.log("buyItem called", itemId, quantity);
  buyItem(itemId, quantity);
  closeBuyQuantityDialog();
}

function renderShop() {
  const container = document.getElementById('shopContainer');
  if (!container) return;
  container.innerHTML = '';
  shopItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card shop-card';
    const canAfford = (gameState[item.currency] || 0) >= item.price;
    
    const cardImageDiv = document.createElement('div');
    cardImageDiv.className = 'card-image';
    
    if (item.image) {
      const img = createImageElement(item.image, item.name, '', (errorImg) => {
        errorImg.src = IMG_PATHS.shop;
      });
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.borderRadius = '12px';
      cardImageDiv.appendChild(img);
    }
    
    div.appendChild(cardImageDiv);
    
    const nameEl = document.createElement('h3');
    nameEl.textContent = item.name;
    div.appendChild(nameEl);
    
    if (item.description) {
      const descEl = document.createElement('p');
      descEl.textContent = item.description;
      div.appendChild(descEl);
    }
    
    const priceEl = document.createElement('div');
    priceEl.className = 'price';
    priceEl.innerHTML = `<strong>${item.currency === 'coins' ? 'Coins' : 'Dust'}:</strong> ${item.price}`;
    div.appendChild(priceEl);
    
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Buy';
    btn.disabled = !canAfford;
    btn.onclick = () => showBuyQuantityDialog(item.id);
    div.appendChild(btn);
    
    container.appendChild(div);
  });
}

function renderAdoptPage() {
  const container = document.getElementById('adopt');
  if (!container) return;
  // Basic form for adoption
  container.innerHTML = `
    <div class="grid">
      <input type="text" id="adopt-name" placeholder="Familiar Name" />
      <select id="adopt-species">
        <option value="cat">Cat</option>
        <option value="wolf">Wolf</option>
        <option value="dragon">Dragon</option>
      </select>
      <button class="btn" onclick="adoptFamiliar()">Adopt</button>
    </div>
  `;
}

function renderPoundPage() {
  const container = document.getElementById('pound');
  if (!container) return;
  container.innerHTML = '<div class="grid" id="poundContainer"></div>';
  const poundContainer = document.getElementById('poundContainer');
  if (!poundContainer) return;
  poundContainer.innerHTML = '';

  if (!gameState.pound || gameState.pound.length === 0) {
    poundContainer.innerHTML = '<p>The pound is currently empty.</p>';
    return;
  }

  gameState.pound.forEach(fam => {
    const imgSrc = getImageSrc(fam, 'familiar');
    const placeholder = familiarImages.default;
    const div = document.createElement('div');
    div.className = 'card familiar-card';
    div.innerHTML = `
      <div class="card-image">
        <img src="${imgSrc}" alt="${fam.name}" class="familiar-thumb" onerror="this.onerror=null;this.src='${placeholder}'">
      </div>
      <h3>${fam.name}</h3>
      <p>Level ${fam.level}</p>
      <button class="btn" onclick="adoptFromPound(${fam.id})">Adopt (100 Coins)</button>
    `;
    poundContainer.appendChild(div);
  });
}

function renderAllSections() {
  renderFamiliars();
  renderInventory();
  renderShop();
  renderAdoptPage();
  renderPoundPage();
}


/* ---------- Visual effects: slash ---------- */
function showSlash(targetEl, imagePath = IMG_PATHS.redClaws) {
  if (!targetEl) return;
  const img = document.createElement('img');
  img.src = imagePath;
  img.className = 'slash-effect';
  // position the slash centrally within the target and give it a modest size
  img.style.position = 'absolute';
  img.style.left = '50%';
  img.style.top = '50%';
  img.style.transform = 'translate(-50%, -50%)';
  img.style.width = '120px';
  img.style.pointerEvents = 'none';
  targetEl.appendChild(img);
  setTimeout(() => img.remove(), 420);
}