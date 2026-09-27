// JS Logic: FIFA World Cup 2026 Dashboard & Monte Carlo Simulator
import { INITIAL_DATA } from './data.js';

// Application State
let teams = JSON.parse(JSON.stringify(INITIAL_DATA.teams));
let matches = JSON.parse(JSON.stringify(INITIAL_DATA.matches));
let groups = INITIAL_DATA.groups;
let currentTab = 'standings';
let predictionChart = null;
let autoPlayInterval = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadAppState();
  calculateAndRender();
  setupEventListeners();
  setupApiSync();
});

// Setup tab navigation
function setupNavigation() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const clickedItem = e.currentTarget;
      const tabName = clickedItem.getAttribute('data-tab');
      
      // Update UI menu state
      menuItems.forEach(btn => btn.classList.remove('active'));
      clickedItem.classList.add('active');
      
      // Update Tab Pane state
      const tabPanes = document.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`tab-${tabName}`).classList.add('active');
      
      currentTab = tabName;
      
      // Update header title
      const pageTitle = document.getElementById('page-title');
      if (tabName === 'standings') pageTitle.textContent = 'Турнирное положение групп';
      if (tabName === 'matches') pageTitle.textContent = 'Центр матчей ЧМ-2026';
      if (tabName === 'analytics') {
        pageTitle.textContent = 'Аналитика и прогнозы победителя';
        // Render chart specifically when switching to analytics tab to ensure sizing is correct
        setTimeout(renderChart, 100);
      }
      if (tabName === 'bracket') pageTitle.textContent = 'Сетка плей-офф (1/16 финала)';
    });
  });
}

// Load state from localStorage if available, else use initial data
function loadAppState() {
  const savedMatches = localStorage.getItem('wc_2026_matches');
  if (savedMatches) {
    try {
      const parsedMatches = JSON.parse(savedMatches);
      // Validate structure matches
      if (parsedMatches.length === matches.length) {
        matches = parsedMatches;
      }
    } catch (e) {
      console.error("Error reading saved matches", e);
    }
  }
}

// Save state to localStorage
function saveAppState() {
  localStorage.setItem('wc_2026_matches', JSON.stringify(matches));
}

// Setup Event Listeners
function setupEventListeners() {
  const handleReset = () => {
    if (confirm("Вы уверены, что хотите сбросить все измененные результаты матчей?")) {
      stopAutoPlay();
      matches = JSON.parse(JSON.stringify(INITIAL_DATA.matches));
      saveAppState();
      calculateAndRender();
    }
  };

  const handleSimulateAll = () => {
    stopAutoPlay();
    simulateRemainingMatches(true);
    calculateAndRender();
  };

  // Reset Button
  document.getElementById('btn-reset-scores').addEventListener('click', handleReset);
  const resetMobile = document.getElementById('btn-reset-scores-mobile');
  if (resetMobile) resetMobile.addEventListener('click', handleReset);

  // Quick Simulate All Remaining Button
  document.getElementById('btn-quick-simulate').addEventListener('click', handleSimulateAll);
  const simulateAllMobile = document.getElementById('btn-quick-simulate-mobile');
  if (simulateAllMobile) simulateAllMobile.addEventListener('click', handleSimulateAll);

  // Auto Play Button
  document.getElementById('btn-auto-play').addEventListener('click', () => {
    toggleAutoPlay();
  });

  // Filter Group Selector
  document.getElementById('filter-group-select').addEventListener('change', () => {
    renderMatchesList();
  });

  // Filter Status Selector
  document.getElementById('filter-status-select').addEventListener('change', () => {
    renderMatchesList();
  });

  // Simulate Filtered matches button
  document.getElementById('btn-simulate-visible').addEventListener('click', () => {
    stopAutoPlay();
    simulateRemainingMatches(false);
    calculateAndRender();
  });
}

function stopAutoPlay() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    const btn = document.getElementById('btn-auto-play');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-play"></i> <span>Авто-игры по одной</span>';
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-secondary');
    }
  }
}

function toggleAutoPlay() {
  if (autoPlayInterval) {
    stopAutoPlay();
  } else {
    const btn = document.getElementById('btn-auto-play');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Остановить игры</span>';
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-danger');
    }
    
    autoPlayInterval = setInterval(() => {
      // Find first unplayed match
      const nextMatch = matches.find(m => m.scoreHome === null || m.scoreAway === null);
      if (nextMatch) {
        const score = simulateMatchScore(nextMatch.home, nextMatch.away);
        nextMatch.scoreHome = score.home;
        nextMatch.scoreAway = score.away;
        nextMatch.status = 'played';
        saveAppState();
        calculateAndRender();
      } else {
        stopAutoPlay();
      }
    }, 800); // 800ms per match
  }
}

// Poisson approximation for goals
function getPoisson(mean) {
  const L = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Simulate match score based on strengths
function simulateMatchScore(teamAId, teamBId) {
  const teamA = teams[teamAId];
  const teamB = teams[teamBId];
  if (!teamA || !teamB) return { home: 0, away: 0 };
  
  // Base expectation of goals per match
  const baseExpectation = 1.35;
  const ratio = teamA.strength / teamB.strength;
  
  const meanHome = baseExpectation * Math.pow(ratio, 1.2);
  const meanAway = baseExpectation * Math.pow(1 / ratio, 1.2);
  
  let scoreHome = getPoisson(meanHome);
  let scoreAway = getPoisson(meanAway);
  
  // Cap extreme scores
  if (scoreHome > 9) scoreHome = 9;
  if (scoreAway > 9) scoreAway = 9;
  
  return { home: scoreHome, away: scoreAway };
}

// Simulate remaining games
// allG = true: simulate all remaining in the whole tournament
// allG = false: simulate only currently filtered games in the matches tab
function simulateRemainingMatches(allG) {
  const groupFilter = document.getElementById('filter-group-select').value;
  const statusFilter = document.getElementById('filter-status-select').value;
  
  matches.forEach(m => {
    if (m.scoreHome === null || m.scoreAway === null) {
      let matchesFilter = true;
      if (!allG) {
        if (groupFilter !== 'all' && m.group !== groupFilter) matchesFilter = false;
        if (statusFilter === 'played') matchesFilter = false; // can't simulate already played games if filtering played
      }
      
      if (matchesFilter) {
        const score = simulateMatchScore(m.home, m.away);
        m.scoreHome = score.home;
        m.scoreAway = score.away;
        m.status = 'played';
      }
    }
  });
  saveAppState();
}

// Calculate standings, stats, predictions and render everything
function calculateAndRender() {
  const standings = calculateStandings(matches);
  const generalStats = calculateGeneralStats();
  
  // Update stats cards in top bar
  document.getElementById('stat-total-goals').textContent = generalStats.totalGoals;
  document.getElementById('stat-played-matches').textContent = generalStats.playedMatches;
  document.getElementById('stat-avg-goals').textContent = generalStats.avgGoals;
  
  // Render Tab contents
  renderStandings(standings);
  renderMatchesList();
  
  // Run Monte Carlo simulation for prediction tab
  const simulationResults = runMonteCarlo(1000);
  renderAnalytics(simulationResults);
  
  // Render Knockout Bracket based on current standings
  const bracketData = buildCurrentBracket(standings);
  renderBracket(bracketData);
}

// Standings calculation logic
function calculateStandings(matchList) {
  const standings = {};
  
  // Init group standings object
  for (const groupName in groups) {
    standings[groupName] = groups[groupName].map(teamId => ({
      id: teamId,
      name: teams[teamId].name,
      flag: teams[teamId].flag,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0
    }));
  }
  
  // Aggregate match results
  matchList.forEach(m => {
    if (m.scoreHome !== null && m.scoreAway !== null) {
      const groupStandings = standings[m.group];
      const homeTeam = groupStandings.find(t => t.id === m.home);
      const awayTeam = groupStandings.find(t => t.id === m.away);
      
      if (homeTeam && awayTeam) {
        homeTeam.played++;
        awayTeam.played++;
        
        homeTeam.goalsFor += m.scoreHome;
        homeTeam.goalsAgainst += m.scoreAway;
        awayTeam.goalsFor += m.scoreAway;
        awayTeam.goalsAgainst += m.scoreHome;
        
        homeTeam.goalDiff = homeTeam.goalsFor - homeTeam.goalsAgainst;
        awayTeam.goalDiff = awayTeam.goalsFor - awayTeam.goalsAgainst;
        
        if (m.scoreHome > m.scoreAway) {
          homeTeam.wins++;
          homeTeam.points += 3;
          awayTeam.losses++;
        } else if (m.scoreHome < m.scoreAway) {
          awayTeam.wins++;
          awayTeam.points += 3;
          homeTeam.losses++;
        } else {
          homeTeam.draws++;
          homeTeam.points += 1;
          awayTeam.draws++;
          awayTeam.points += 1;
        }
      }
    }
  });
  
  // Sort each group
  for (const groupName in standings) {
    standings[groupName].sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Goal Difference
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      // 3. Goals For
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      // 4. Team Strength (FIFA rank / rating fallback)
      return teams[b.id].strength - teams[a.id].strength;
    });
  }
  
  return standings;
}

// Calculate general stats
function calculateGeneralStats() {
  let playedMatches = 0;
  let totalGoals = 0;
  
  matches.forEach(m => {
    if (m.scoreHome !== null && m.scoreAway !== null) {
      playedMatches++;
      totalGoals += (m.scoreHome + m.scoreAway);
    }
  });
  
  const avgGoals = playedMatches > 0 ? (totalGoals / playedMatches).toFixed(2) : "0.00";
  return { playedMatches, totalGoals, avgGoals };
}

// Render Standings Tab
function renderStandings(standings) {
  const container = document.getElementById('groups-container');
  container.innerHTML = '';
  
  for (const groupName in standings) {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card card';
    
    let html = `
      <div class="group-title">
        <span>Группа ${groupName}</span>
        <i class="fa-solid fa-ranking-star"></i>
      </div>
      <table class="group-table">
        <thead>
          <tr>
            <th>Команда</th>
            <th class="num-cell">И</th>
            <th class="num-cell">РМ</th>
            <th class="num-cell points-cell">О</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    standings[groupName].forEach((team, index) => {
      let rowClass = '';
      if (index === 0) rowClass = 'qualified-row-1';
      else if (index === 1) rowClass = 'qualified-row-2';
      
      const gdSign = team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff;
      
      html += `
        <tr class="${rowClass}">
          <td>
            <div class="team-cell">
              <span class="team-flag">${team.flag}</span>
              <span class="team-name" title="${team.name}">${team.name}</span>
            </div>
          </td>
          <td class="num-cell">${team.played}</td>
          <td class="num-cell">${gdSign}</td>
          <td class="num-cell points-cell">${team.points}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    groupCard.innerHTML = html;
    container.appendChild(groupCard);
  }
}

// Calculate betting odds based on team strength
function calculateMatchOdds(homeTeamId, awayTeamId) {
  const teamA = teams[homeTeamId];
  const teamB = teams[awayTeamId];
  if (!teamA || !teamB) return { home: "1.00", draw: "1.00", away: "1.00" };
  
  const ratio = teamA.strength / teamB.strength;
  
  let pA_raw = 0.45 * Math.pow(ratio, 1.5);
  let pB_raw = 0.45 * Math.pow(1 / ratio, 1.5);
  let pDraw_raw = 0.28;
  
  // Normalize
  const sum = pA_raw + pB_raw + pDraw_raw;
  const pA = pA_raw / sum;
  const pB = pB_raw / sum;
  const pDraw = pDraw_raw / sum;
  
  // Apply 5% bookmaker margin
  const margin = 1.05;
  const oddsHome = Math.min(25.0, Math.max(1.01, 1 / (pA * margin))).toFixed(2);
  const oddsDraw = Math.min(15.0, Math.max(1.01, 1 / (pDraw * margin))).toFixed(2);
  const oddsAway = Math.min(25.0, Math.max(1.01, 1 / (pB * margin))).toFixed(2);
  
  return { home: oddsHome, draw: oddsDraw, away: oddsAway };
}

// Render Matches list
function renderMatchesList() {
  const container = document.getElementById('matches-container');
  container.innerHTML = '';
  
  const groupFilter = document.getElementById('filter-group-select').value;
  const statusFilter = document.getElementById('filter-status-select').value;
  
  const filtered = matches.filter(m => {
    if (groupFilter !== 'all' && m.group !== groupFilter) return false;
    if (statusFilter === 'played' && (m.scoreHome === null || m.scoreAway === null)) return false;
    if (statusFilter === 'scheduled' && m.scoreHome !== null && m.scoreAway !== null) return false;
    return true;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card text-center text-muted p-4">
        <i class="fa-regular fa-calendar-xmark fa-2x mb-2"></i>
        <p>Матчи с выбранными фильтрами не найдены.</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(m => {
    const homeTeam = teams[m.home];
    const awayTeam = teams[m.away];
    
    const card = document.createElement('div');
    card.className = 'match-card card';
    
    const valHome = m.scoreHome !== null ? m.scoreHome : '';
    const valAway = m.scoreAway !== null ? m.scoreAway : '';
    
    const odds = calculateMatchOdds(m.home, m.away);
    
    card.innerHTML = `
      <div class="match-meta">
        <span class="match-group-badge">Группа ${m.group}</span>
        <span>${m.date} • ${m.time || "21:00"} (Бельгия)</span>
      </div>
      
      <div class="match-team home">
        <span class="team-name" title="${homeTeam.name}">${homeTeam.name}</span>
        <span class="team-flag">${homeTeam.flag}</span>
      </div>
      
      <div class="match-score-section">
        <div class="score-input-container">
          <input type="number" min="0" max="9" class="score-input home-score-input" data-id="${m.id}" value="${valHome}" placeholder="-">
          <span class="score-divider">:</span>
          <input type="number" min="0" max="9" class="score-input away-score-input" data-id="${m.id}" value="${valAway}" placeholder="-">
        </div>
        <div class="match-odds">
          <span class="odds-val" title="Победа ${homeTeam.name}">П1: <strong>${odds.home}</strong></span>
          <span class="odds-val" title="Ничья">X: <strong>${odds.draw}</strong></span>
          <span class="odds-val" title="Победа ${awayTeam.name}">П2: <strong>${odds.away}</strong></span>
        </div>
      </div>
      
      <div class="match-team away">
        <span class="team-flag">${awayTeam.flag}</span>
        <span class="team-name" title="${awayTeam.name}">${awayTeam.name}</span>
      </div>
      
      <div class="match-actions">
        <button class="btn btn-outline btn-sm btn-simulate-single" data-id="${m.id}">
          <i class="fa-solid fa-dice"></i> Симулировать
        </button>
        ${(m.scoreHome !== null || m.scoreAway !== null) ? `
          <button class="btn btn-outline btn-sm btn-clear-single text-danger" data-id="${m.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        ` : ''}
      </div>
    `;
    
    // Inputs Event Listeners
    const homeInput = card.querySelector('.home-score-input');
    const awayInput = card.querySelector('.away-score-input');
    
    const onScoreChange = () => {
      const hVal = homeInput.value.trim();
      const aVal = awayInput.value.trim();
      
      if (hVal !== '' && aVal !== '') {
        m.scoreHome = parseInt(hVal, 10);
        m.scoreAway = parseInt(aVal, 10);
        m.status = 'played';
      } else {
        m.scoreHome = null;
        m.scoreAway = null;
        m.status = 'scheduled';
      }
      saveAppState();
      calculateAndRender();
    };
    
    homeInput.addEventListener('change', onScoreChange);
    awayInput.addEventListener('change', onScoreChange);
    
    // Simulate single match button
    card.querySelector('.btn-simulate-single').addEventListener('click', () => {
      const score = simulateMatchScore(m.home, m.away);
      m.scoreHome = score.home;
      m.scoreAway = score.away;
      m.status = 'played';
      saveAppState();
      calculateAndRender();
    });
    
    // Clear single match score button
    const clearBtn = card.querySelector('.btn-clear-single');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        m.scoreHome = null;
        m.scoreAway = null;
        m.status = 'scheduled';
        saveAppState();
        calculateAndRender();
      });
    }
    
    container.appendChild(card);
  });
}

// Monte Carlo simulation runner
// Runs N simulations from the CURRENT state of group stage matches
function runMonteCarlo(iterations = 1000) {
  const counts = {};
  
  // Init win counters for all 48 teams
  for (const teamId in teams) {
    counts[teamId] = {
      win: 0,
      final: 0,
      semi: 0,
      qf: 0,
      r16: 0,
      r32: 0
    };
  }
  
  // Run iterations
  for (let i = 0; i < iterations; i++) {
    // 1. Copy matches database
    const simMatches = JSON.parse(JSON.stringify(matches));
    
    // 2. Simulate remaining matches in group stage
    simMatches.forEach(m => {
      if (m.scoreHome === null || m.scoreAway === null) {
        const score = simulateMatchScore(m.home, m.away);
        m.scoreHome = score.home;
        m.scoreAway = score.away;
      }
    });
    
    // 3. Compute group standings
    const simStandings = calculateStandings(simMatches);
    
    // 4. Determine 32 teams qualified for knockout stage
    const qualified = getKnockoutQualifiers(simStandings);
    qualified.forEach(t => {
      if (counts[t]) counts[t].r32++;
    });
    
    if (qualified.length < 32) continue; // safety fallback
    
    // 5. Build Round of 32 matches
    let r32Matches = pairRoundOf32(qualified);
    
    // 6. Simulate Round of 32 -> Round of 16
    let r16Teams = [];
    r32Matches.forEach(m => {
      const winner = simKnockoutMatch(m.teamA, m.teamB);
      r16Teams.push(winner);
      if (counts[winner]) counts[winner].r16++;
    });
    
    // 7. Simulate Round of 16 -> Quarter-finals
    let qfTeams = [];
    for (let m = 0; m < 8; m++) {
      const winner = simKnockoutMatch(r16Teams[m*2], r16Teams[m*2+1]);
      qfTeams.push(winner);
      if (counts[winner]) counts[winner].qf++;
    }
    
    // 8. Simulate Quarter-finals -> Semi-finals
    let sfTeams = [];
    for (let m = 0; m < 4; m++) {
      const winner = simKnockoutMatch(qfTeams[m*2], qfTeams[m*2+1]);
      sfTeams.push(winner);
      if (counts[winner]) counts[winner].semi++;
    }
    
    // 9. Simulate Semi-finals -> Final
    let finalTeams = [];
    for (let m = 0; m < 2; m++) {
      const winner = simKnockoutMatch(sfTeams[m*2], sfTeams[m*2+1]);
      finalTeams.push(winner);
      if (counts[winner]) counts[winner].final++;
    }
    
    // 10. Simulate Final
    const champion = simKnockoutMatch(finalTeams[0], finalTeams[1]);
    if (counts[champion]) counts[champion].win++;
  }
  
  // Convert counts to percentages
  const results = [];
  for (const teamId in teams) {
    results.push({
      id: teamId,
      name: teams[teamId].name,
      flag: teams[teamId].flag,
      win: parseFloat((counts[teamId].win / iterations * 100).toFixed(1)),
      final: parseFloat((counts[teamId].final / iterations * 100).toFixed(1)),
      semi: parseFloat((counts[teamId].semi / iterations * 100).toFixed(1)),
      r32: parseFloat((counts[teamId].r32 / iterations * 100).toFixed(1))
    });
  }
  
  // Sort by Win probability
  results.sort((a, b) => b.win - a.win);
  return results;
}

// Simulates a single knockout match to resolve a winner (no draws)
function simKnockoutMatch(teamAId, teamBId) {
  const score = simulateMatchScore(teamAId, teamBId);
  if (score.home > score.away) return teamAId;
  if (score.away > score.home) return teamBId;
  
  // In case of a draw, simulate penalty shootouts using team strengths
  const strA = teams[teamAId].strength;
  const strB = teams[teamBId].strength;
  const probabilityA = 0.5 + (strA - strB) * 0.005; // range: ~35% to 65%
  return Math.random() < probabilityA ? teamAId : teamBId;
}

// Determine 32 teams qualified for knockout stage
function getKnockoutQualifiers(standings) {
  const qualifiers = [];
  const thirdPlaced = [];
  
  // Top 2 of each group qualify directly
  for (const groupName in standings) {
    const group = standings[groupName];
    if (group[0]) qualifiers.push({ id: group[0].id, points: group[0].points, goalDiff: group[0].goalDiff, goalsFor: group[0].goalsFor, origin: `1${groupName}` });
    if (group[1]) qualifiers.push({ id: group[1].id, points: group[1].points, goalDiff: group[1].goalDiff, goalsFor: group[1].goalsFor, origin: `2${groupName}` });
    if (group[2]) thirdPlaced.push({ id: group[2].id, points: group[2].points, goalDiff: group[2].goalDiff, goalsFor: group[2].goalsFor, origin: `3${groupName}` });
  }
  
  // Sort third-placed teams
  thirdPlaced.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return teams[b.id].strength - teams[a.id].strength;
  });
  
  // Take top 8 third-placed teams
  const bestThird = thirdPlaced.slice(0, 8);
  
  // Combine all 32 qualifiers
  const all32 = [...qualifiers, ...bestThird];
  return all32;
}

// Pairs the 32 teams into 16 matches of Round of 32
function pairRoundOf32(qualifiers) {
  // Extract teams by their origin
  const getTeam = (originPrefix) => {
    const found = qualifiers.find(q => q.origin === originPrefix);
    return found ? found.id : null;
  };
  
  const getBestThirdTeam = (index) => {
    const thirds = qualifiers.filter(q => q.origin.startsWith('3'));
    return thirds[index] ? thirds[index].id : 'UNKNOWN_3RD';
  };
  
  // Matches list matching our simplified bracket structure
  return [
    { teamA: getTeam('1A') || '1A', teamB: getBestThirdTeam(0) },
    { teamA: getTeam('2B') || '2B', teamB: getTeam('2C') || '2C' },
    { teamA: getTeam('1C') || '1C', teamB: getBestThirdTeam(1) },
    { teamA: getTeam('2D') || '2D', teamB: getTeam('2E') || '2E' },
    
    { teamA: getTeam('1E') || '1E', teamB: getBestThirdTeam(2) },
    { teamA: getTeam('2F') || '2F', teamB: getTeam('2G') || '2G' },
    { teamA: getTeam('1G') || '1G', teamB: getBestThirdTeam(3) },
    { teamA: getTeam('2H') || '2H', teamB: getTeam('2I') || '2I' },
    
    { teamA: getTeam('1I') || '1I', teamB: getBestThirdTeam(4) },
    { teamA: getTeam('2J') || '2J', teamB: getTeam('2K') || '2K' },
    { teamA: getTeam('1K') || '1K', teamB: getBestThirdTeam(5) },
    { teamA: getTeam('2L') || '2L', teamB: getTeam('2A') || '2A' },
    
    { teamA: getTeam('1B') || '1B', teamB: getBestThirdTeam(6) },
    { teamA: getTeam('1D') || '1D', teamB: getBestThirdTeam(7) },
    { teamA: getTeam('1F') || '1F', teamB: getTeam('2H') || '2H_TEMP' },
    { teamA: getTeam('1H') || '1H', teamB: getTeam('2J') || '2J_TEMP' }
  ];
}

// Render Analytics Tab
function renderAnalytics(results) {
  // 1. Top list
  const topList = document.getElementById('top-teams-list');
  topList.innerHTML = '';
  
  const top10 = results.slice(0, 8);
  top10.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'top-team-row';
    row.innerHTML = `
      <span class="rank-badge">#${index+1}</span>
      <span class="team-flag">${item.flag}</span>
      <span><strong>${item.name}</strong></span>
      <span class="text-right text-gold font-weight-bold">${item.win}%</span>
    `;
    topList.appendChild(row);
  });
  
  // 2. Commentary
  const commentaryBox = document.getElementById('ai-commentary');
  commentaryBox.innerHTML = '';
  
  // Compile comments based on actual tournament status
  const comments = [];
  
  const leader = results[0];
  comments.push({
    text: `Наш суперкомпьютер AI прогнозирует, что сборная <strong>${leader.name} ${leader.flag}</strong> имеет наибольшие шансы выиграть Чемпионат мира 2026 с вероятностью <strong>${leader.win}%</strong>, благодаря ее силе и турнирной сетке.`,
    type: 'hot'
  });
  
  // Check Germany stats
  const gerMatch = matches.find(m => m.home === 'GER' && m.away === 'CUW');
  if (gerMatch && gerMatch.scoreHome === 7) {
    comments.push({
      text: `Разгромная победа Германии над Кюрасао со счетом 7:1 вывела немцев в лидеры по результативности. Их показатель силы вырос, а вероятность попадания в финал оценивается в <strong>${results.find(t=>t.id==='GER').final}%</strong>.`,
      type: 'stat'
    });
  }
  
  // Check USA stats
  const usaMatch = matches.find(m => m.home === 'USA' && m.away === 'PRY');
  if (usaMatch && usaMatch.scoreHome === 4) {
    comments.push({
      text: `Сборная США отлично провела стартовый матч с Парагваем (4:1) и имеет высокие шансы на проход из группы D (<strong>${results.find(t=>t.id==='USA').r32}%</strong>).`,
      type: 'stat'
    });
  }
  
  // General prediction comment
  comments.push({
    text: `Бразилия (${results.find(t=>t.id==='BRA').win}%) и Франция (${results.find(t=>t.id==='FRA').win}%) замыкают тройку главных фаворитов мундиаля. Их первый тур группового этапа несколько скорректировал ожидания, но они остаются грозной силой.`,
    type: 'normal'
  });
  
  comments.forEach(c => {
    const el = document.createElement('div');
    el.className = `commentary-item ${c.type}`;
    el.innerHTML = c.text;
    commentaryBox.appendChild(el);
  });
}

// Render Winning Probability Chart
function renderChart() {
  if (currentTab !== 'analytics') return;
  
  // Re-run Monte Carlo to get latest probabilities
  const results = runMonteCarlo(1000).slice(0, 10); // top 10
  
  const ctx = document.getElementById('predictionChart').getContext('2d');
  
  const labels = results.map(r => `${r.flag} ${r.name}`);
  const data = results.map(r => r.win);
  
  if (predictionChart) {
    predictionChart.destroy();
  }
  
  predictionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Шансы на победу в турнире (%)',
        data: data,
        backgroundColor: [
          'rgba(212, 175, 55, 0.85)', // Gold for #1
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)'
        ],
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#9ca3af'
          },
          max: Math.ceil(Math.max(...data) * 1.2) // Give some padding
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#f3f4f6',
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        }
      }
    }
  });
}

// Build Bracket Data from Group standings projection
function buildCurrentBracket(standings) {
  // Translate standings into qualifiers structure
  const simQualifiers = getKnockoutQualifiers(standings);
  const r32Pairings = pairRoundOf32(simQualifiers);
  
  // Standard simulated projection for later rounds based on team strengths
  const getWinnerNode = (tA, tB) => {
    if (tA.startsWith('1') || tA.startsWith('2') || tA.startsWith('3') || tA.startsWith('UNKNOWN')) {
      return { id: `Победитель матча`, flag: '🏳️', name: `Победитель: ${tA} / ${tB}`, strength: 70 };
    }
    const teamA = teams[tA];
    const teamB = teams[tB];
    if (!teamA || !teamB) return { id: 'TBD', flag: '🏳️', name: 'Определяется', strength: 50 };
    
    // Simulate a deterministic winner or stronger team projection
    if (teamA.strength > teamB.strength) return teamA;
    return teamB;
  };
  
  const buildKnockoutRound = (roundMatches) => {
    return roundMatches.map(m => {
      const teamAName = m.teamA.length <= 3 ? teams[m.teamA]?.name || m.teamA : m.teamA;
      const teamAFlag = m.teamA.length <= 3 ? teams[m.teamA]?.flag || '🏳️' : '🏳️';
      
      const teamBName = m.teamB.length <= 3 ? teams[m.teamB]?.name || m.teamB : m.teamB;
      const teamBFlag = m.teamB.length <= 3 ? teams[m.teamB]?.flag || '🏳️' : '🏳️';
      
      // Calculate projected winner
      const projectedWinner = getWinnerNode(m.teamA, m.teamB);
      
      return {
        teamA: { id: m.teamA, name: teamAName, flag: teamAFlag },
        teamB: { id: m.teamB, name: teamBName, flag: teamBFlag },
        winner: projectedWinner
      };
    });
  };
  
  // Round of 32
  const r32 = buildKnockoutRound(r32Pairings);
  
  // Round of 16
  const r16Pairings = [];
  for (let i = 0; i < 8; i++) {
    r16Pairings.push({ teamA: r32[i*2].winner.id, teamB: r32[i*2+1].winner.id });
  }
  const r16 = buildKnockoutRound(r16Pairings);
  
  // Quarter-finals
  const qfPairings = [];
  for (let i = 0; i < 4; i++) {
    qfPairings.push({ teamA: r16[i*2].winner.id, teamB: r16[i*2+1].winner.id });
  }
  const qf = buildKnockoutRound(qfPairings);
  
  // Semi-finals
  const sfPairings = [];
  for (let i = 0; i < 2; i++) {
    sfPairings.push({ teamA: qf[i*2].winner.id, teamB: qf[i*2+1].winner.id });
  }
  const sf = buildKnockoutRound(sfPairings);
  
  // Final
  const fPairings = [{ teamA: sf[0].winner.id, teamB: sf[1].winner.id }];
  const f = buildKnockoutRound(fPairings);
  
  return { r32, r16, qf, sf, f };
}

// Render Visual Tournament Bracket
function renderBracket(bracketData) {
  const treeContainer = document.getElementById('bracket-tree');
  treeContainer.innerHTML = '';
  
  const rounds = [
    { name: '1/16 Финала', data: bracketData.r32 },
    { name: '1/8 Финала', data: bracketData.r16 },
    { name: '1/4 Финала', data: bracketData.qf },
    { name: 'Полуфиналы', data: bracketData.sf },
    { name: 'Финал', data: bracketData.f }
  ];
  
  rounds.forEach((round, roundIndex) => {
    const col = document.createElement('div');
    col.className = 'bracket-column';
    
    col.innerHTML = `<div class="bracket-column-title">${round.name}</div>`;
    
    round.data.forEach((match, matchIndex) => {
      const matchNode = document.createElement('div');
      matchNode.className = 'bracket-match';
      
      const isWinnerA = match.winner.id === match.teamA.id;
      const isWinnerB = match.winner.id === match.teamB.id;
      
      matchNode.innerHTML = `
        <div class="bracket-match-info">Матч ${matchIndex + 1}</div>
        
        <div class="bracket-team-row ${isWinnerA ? 'bracket-winner' : ''}">
          <span class="bracket-team-name">
            <span>${match.teamA.flag}</span>
            <span title="${match.teamA.name}">${match.teamA.name}</span>
          </span>
          <span class="bracket-score">${isWinnerA ? '🏆' : ''}</span>
        </div>
        
        <div class="bracket-team-row ${isWinnerB ? 'bracket-winner' : ''}">
          <span class="bracket-team-name">
            <span>${match.teamB.flag}</span>
            <span title="${match.teamB.name}">${match.teamB.name}</span>
          </span>
          <span class="bracket-score">${isWinnerB ? '🏆' : ''}</span>
        </div>
      `;
      
      col.appendChild(matchNode);
    });
    
    treeContainer.appendChild(col);
  });
}

// API-Football Sync integration
const API_TEAM_MAPPING = {
  "Mexico": "MEX", "South Africa": "ZAF", "Czech Republic": "CZE", "Czechia": "CZE", "South Korea": "KOR", "Korea Republic": "KOR",
  "Canada": "CAN", "Bosnia & Herzegovina": "BIH", "Bosnia and Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "CHE",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "USA": "USA", "United States": "USA", "Paraguay": "PRY", "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Curaçao": "CUW", "Ivory Coast": "CIV", "Ecuador": "ECU",
  "Netherlands": "NLD", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Cabo Verde": "CPV", "Saudi Arabia": "SAU", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "DZA", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "PRT", "DR Congo": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "HRV", "Ghana": "GHA", "Panama": "PAN"
};

function setupApiSync() {
  const toggleBtn = document.getElementById('api-settings-toggle');
  const body = document.getElementById('api-settings-body');
  const icon = document.getElementById('api-toggle-icon');
  const keyInput = document.getElementById('api-key-input');
  const syncBtn = document.getElementById('btn-sync-api');
  const statusDiv = document.getElementById('api-sync-status');
  
  if (!toggleBtn || !body) return;
  
  // Default API Key fallback provided by the user
  const defaultKey = '2a98172da953047947f81e4a998f0711';
  const savedKey = localStorage.getItem('wc_2026_api_key') || defaultKey;
  
  if (savedKey) {
    keyInput.value = savedKey;
    if (!localStorage.getItem('wc_2026_api_key')) {
      localStorage.setItem('wc_2026_api_key', defaultKey);
    }
  }
  
  // Toggle Collapse
  toggleBtn.style.transition = 'transform 0.3s';
  toggleBtn.addEventListener('click', () => {
    const isCollapsed = body.style.display === 'none';
    body.style.display = isCollapsed ? 'block' : 'none';
    icon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
  });
  
  // Save Key on change
  keyInput.addEventListener('change', () => {
    localStorage.setItem('wc_2026_api_key', keyInput.value.trim());
  });
  
  // Shared Sync logic
  async function triggerSync(key) {
    syncBtn.disabled = true;
    statusDiv.innerHTML = '<span class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Подключение к API-Sports и скачивание результатов...</span>';
    
    try {
      // Fetch fixtures from API-Football for League 1 (World Cup), Season 2026
      const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
        method: 'GET',
        headers: {
          'x-apisports-key': key
        }
      });
      
      const data = await response.json();
      
      if (data.errors && Object.keys(data.errors).length > 0) {
        throw new Error(JSON.stringify(data.errors));
      }
      
      if (!data.response || data.response.length === 0) {
        throw new Error("Не найдено матчей в этом сезоне.");
      }
      
      let updatedCount = 0;
      
      data.response.forEach(item => {
        const apiHomeName = item.teams.home.name;
        const apiAwayName = item.teams.away.name;
        
        const mappedHome = API_TEAM_MAPPING[apiHomeName];
        const mappedAway = API_TEAM_MAPPING[apiAwayName];
        
        if (mappedHome && mappedAway) {
          const match = matches.find(m => m.home === mappedHome && m.away === mappedAway && m.group !== 'knockout');
          if (match) {
            // Parse and format kickoff date & time in Belgian time (Europe/Brussels)
            const dateObj = new Date(item.fixture.date);
            const apiBelgianDate = new Intl.DateTimeFormat('ru-RU', {
              timeZone: 'Europe/Brussels',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).format(dateObj);
            
            const apiBelgianTime = new Intl.DateTimeFormat('ru-RU', {
              timeZone: 'Europe/Brussels',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).format(dateObj);
            
            // Sync date and time if changed
            if (match.date !== apiBelgianDate || match.time !== apiBelgianTime) {
              match.date = apiBelgianDate;
              match.time = apiBelgianTime;
              updatedCount++;
            }
            
            // Sync score if finished
            const fixtureStatus = item.fixture.status.short;
            const isFinished = ['FT', 'AET', 'PEN'].includes(fixtureStatus);
            if (isFinished) {
              const goalsHome = item.goals.home;
              const goalsAway = item.goals.away;
              
              if (match.scoreHome !== goalsHome || match.scoreAway !== goalsAway) {
                match.scoreHome = goalsHome;
                match.scoreAway = goalsAway;
                match.status = 'played';
                updatedCount++;
              }
            }
          }
        }
      });
      
      syncBtn.disabled = false;
      localStorage.setItem('wc_2026_last_sync_time', Date.now().toString());
      
      if (updatedCount > 0) {
        saveAppState();
        calculateAndRender();
        statusDiv.innerHTML = `<span class="text-green"><i class="fa-solid fa-circle-check"></i> Синхронизация успешна! Обновлено результатов: ${updatedCount}.</span>`;
      } else {
        statusDiv.innerHTML = '<span class="text-blue"><i class="fa-solid fa-circle-info"></i> Все результаты соответствуют API (последняя проверка: только что).</span>';
      }
      
    } catch (err) {
      console.error(err);
      syncBtn.disabled = false;
      statusDiv.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Ошибка синхронизации: ${err.message || err}. Проверьте правильность API-ключа.</span>`;
    }
  }

  // Click Sync Event
  syncBtn.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (!key) {
      statusDiv.innerHTML = '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Пожалуйста, введите API-ключ!</span>';
      return;
    }
    triggerSync(key);
  });

  // Auto-sync on page load if key is available and last sync was > 15 min ago
  if (savedKey) {
    const lastSync = localStorage.getItem('wc_2026_last_sync_time');
    const now = Date.now();
    if (!lastSync || (now - parseInt(lastSync, 10)) > 15 * 60 * 1000) {
      setTimeout(() => {
        triggerSync(savedKey);
      }, 1000);
    }
  }
}
