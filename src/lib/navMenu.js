/**
 * Navigation Menu Module
 * Handles race search functionality
 */

import { fetchRacesFromAPI } from './googleSheets.js';
import { base } from '$app/paths';
import { goto } from '$app/navigation';

// Race type mapping - matches sheet names in the Elections Running 2026 spreadsheet
const RACE_TYPES = [
	{ value: 'Assembly', label: 'State Assembly', hasDistricts: true },
	{ value: 'Senate', label: 'State Senate', hasDistricts: true },
	{ value: 'US Congress', label: 'U.S. Congress', hasDistricts: true },
	{ value: 'Governor', label: 'Governor', hasDistricts: false }
];

let raceTypeData = {};

/**
 * Initialize the navigation menu
 */
async function init() {
	try {
		// Populate race type dropdown
		populateRaceTypes();
		
		// Set up event listeners
		setupEventListeners();
		
	} catch (error) {
		console.error('Error initializing navigation menu:', error);
	}
}

/**
 * Populate the race type dropdown
 */
function populateRaceTypes() {
	const raceTypeSelect = document.getElementById('race-type-select');
	if (!raceTypeSelect) return;
	
	// Clear existing options except the first one
	raceTypeSelect.innerHTML = '<option value="">Select race type...</option>';
	
	RACE_TYPES.forEach(race => {
		const option = document.createElement('option');
		option.value = race.value;
		option.textContent = race.label;
		option.dataset.hasDistricts = race.hasDistricts;
		raceTypeSelect.appendChild(option);
	});
}

/**
 * Set up event listeners for the menu
 */
function setupEventListeners() {
	// Race type selection
	const raceTypeSelect = document.getElementById('race-type-select');
	if (raceTypeSelect) {
		raceTypeSelect.addEventListener('change', handleRaceTypeChange);
	}
	
	// District selection
	const districtSelect = document.getElementById('district-select');
	if (districtSelect) {
		districtSelect.addEventListener('change', handleDistrictChange);
	}
	
	// Race search button
	const raceSearchBtn = document.getElementById('race-search-btn');
	if (raceSearchBtn) {
		raceSearchBtn.addEventListener('click', handleRaceSearch);
	}
}

/**
 * Handle race type selection change
 */
async function handleRaceTypeChange(e) {
	const raceType = e.target.value;
	const selectedOption = e.target.options[e.target.selectedIndex];
	const hasDistricts = selectedOption.dataset.hasDistricts === 'true';
	
	const districtGroup = document.getElementById('district-select-group');
	const districtSelect = document.getElementById('district-select');
	const raceSearchBtn = document.getElementById('race-search-btn');
	
	if (!raceType) {
		districtGroup.style.display = 'none';
		raceSearchBtn.style.display = 'none';
		return;
	}
	
	if (hasDistricts) {
		// Load districts for this race type
		await loadDistricts(raceType);
		districtGroup.style.display = 'block';
		raceSearchBtn.style.display = 'none';
	} else {
		// No districts needed (like Governor)
		districtGroup.style.display = 'none';
		raceSearchBtn.style.display = 'block';
	}
}

/**
 * Load districts for a specific race type
 */
async function loadDistricts(raceType) {
	const districtSelect = document.getElementById('district-select');
	if (!districtSelect) return;
	
	districtSelect.innerHTML = '<option value="">Loading...</option>';
	
	try {
		// Fetch race data from the Elections Running 2026 spreadsheet
		const races = await fetchRacesFromAPI(raceType);
		raceTypeData[raceType] = races;
		
		// Get unique districts and their corresponding race-ids
		const districtMap = new Map();
		races.forEach(race => {
			const districtNum = race['district-number'];
			const raceId = race['race-id'];
			if (districtNum && raceId) {
				districtMap.set(districtNum, raceId);
			}
		});
		
		// Sort districts numerically
		const districts = Array.from(districtMap.keys()).sort((a, b) => {
			const numA = parseInt(a);
			const numB = parseInt(b);
			return numA - numB;
		});
		
		districtSelect.innerHTML = '<option value="">Select district...</option>';
		districts.forEach(districtNum => {
			const option = document.createElement('option');
			option.value = districtNum;
			option.dataset.raceId = districtMap.get(districtNum);
			option.textContent = `District ${districtNum}`;
			districtSelect.appendChild(option);
		});
	} catch (error) {
		console.error('Error loading districts:', error);
		districtSelect.innerHTML = '<option value="">Error loading districts</option>';
	}
}

/**
 * Handle district selection change
 */
function handleDistrictChange(e) {
	const raceSearchBtn = document.getElementById('race-search-btn');
	if (!raceSearchBtn) return;
	
	if (e.target.value) {
		raceSearchBtn.style.display = 'block';
	} else {
		raceSearchBtn.style.display = 'none';
	}
}

/**
 * Handle race search button click
 */
function handleRaceSearch() {
	const raceTypeSelect = document.getElementById('race-type-select');
	const districtSelect = document.getElementById('district-select');
	
	if (!raceTypeSelect) return;
	
	const raceType = raceTypeSelect.value;
	const selectedOption = raceTypeSelect.options[raceTypeSelect.selectedIndex];
	const hasDistricts = selectedOption.dataset.hasDistricts === 'true';
	
	let racePath = '';
	let raceId = '';
	
	// Determine race path
	if (raceType === 'Assembly') {
		racePath = 'assembly';
	} else if (raceType === 'Senate') {
		racePath = 'senate';
	} else if (raceType === 'US Congress') {
		racePath = 'congress';
	} else if (raceType === 'Governor') {
		racePath = 'wisconsin-governor';
	} else {
		alert('Please select a race type');
		return;
	}
	
	// Get race-id if applicable
	if (hasDistricts) {
		if (!districtSelect || !districtSelect.value) {
			alert('Please select a district');
			return;
		}
		// Get the race-id from the selected district option
		const selectedDistrictOption = districtSelect.options[districtSelect.selectedIndex];
		raceId = selectedDistrictOption.dataset.raceId;
		
		if (!raceId) {
			alert('Error: Race ID not found');
			return;
		}
	} else {
		// For statewide races like Governor, use appropriate race-id
		raceId = 'go-1';
	}
	
	const url = `${base}/${racePath}/${raceId}`;
	closeMenu();
	goto(url);
}

/**
 * Close the navigation menu
 */
function closeMenu() {
	const overlay = document.querySelector('.nav-menu-overlay');
	const menu = document.querySelector('.nav-menu');
	
	if (overlay) {
		overlay.classList.remove('open');
	}
	if (menu) {
		menu.classList.remove('open');
	}
}

export default {
	init
};
