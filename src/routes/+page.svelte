<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/bento-grid.css">
	<link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
	<script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
</svelte:head>

<style>
    .address-search-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    #address-map {
        border:#3090c9 2px solid;
        border-radius: 8px;
        padding-top: 1rem;
        padding-bottom: 1rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .search-box {
        display: flex;
        gap: 0.5rem;
        position: relative;
    }

    .address-input {
        flex: 1;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 3px solid #0073aa;
        border-radius: 50px;
        transition: border 0.2s, box-shadow 0.2s;
    }

    .address-input:hover, .address-input:focus {
        outline: none;
        border: 3px solid #233166;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .address-input:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }

    .suggestions-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 0px solid #3090c9;
        border-top: none;
        border-radius: 0 0 4px 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        margin-top: 0px;
    }

    .suggestion-item {
        width: 100%;
        padding: 0.75rem 1rem;
        text-align: left;
        background: white;
        border: none;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        font-size: 0.95rem;
        color: #000;
        transition: background-color 0.2s;
    }

    .suggestion-item:last-child {
        border-bottom: none;
    }

    .suggestion-item:hover {
        background-color: #f0f8ff;
    }

    .error-message {
        padding: 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 4px;
        color: #c00;
        margin-bottom: 1rem;
    }

    .error-message p {
        margin: 0;
    }

    .results-container {
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 2rem;
        margin-top: 1.5rem;
    }

    .results-container h3 {
        margin-top: 0;
        color: #333;
        text-align: center;
        font-size: 1.5rem;
    }

    .address-result {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .district-results {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin: 1.5rem 0;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }

    .district-card {
        background-color: white;
        border: 2px solid #3090c9;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
        display: flex;
        flex-direction: column;
    }

    .district-card-link {
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .district-card-link:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(35, 49, 102, 0.3);
        border-color: #233166;
    }

    .click-hint {
        margin-top: 1rem;
        color: #3090c9;
        font-weight: 500;
    }

    .district-card h4 {
        margin: 0 0 0.5rem 0;
        color: #3090c9;
        font-size: 1rem;
        font-weight: 600;
    }

    .district-number {
        margin: 0;
        font-size: 1.75rem;
        font-weight: bold;
        color: #333;
    }

    .district-map {
        width: 100%;
        height: 0;
        padding-bottom: 65%; /* Adjusted aspect ratio for larger single-column display */
        position: relative;
        border-radius: 4px;
        margin-top: auto;
    }

    .district-map > div {
        position: absolute !important;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .coordinates-info {
        text-align: center;
        margin-top: 1rem;
        color: #999;
    }

    .coordinates-info small {
        font-size: 0.85rem;
    }

    .previous-results-container {
        background-color: #f0f8ff;
        padding: 1rem;
        margin-top: 1.5rem;
        text-align: center;
    }

    .previous-results-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .calendars-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .calendar {
        background: white;
        border: 2px solid #3090c9;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(48, 144, 201, 0.1);
        position: relative;
        overflow: visible;
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
    }

    .calendar-header {
        text-align: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #3090c9;
    }

    .calendar-header h4 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        width: 100%;
    }

    .calendar-day-header {
        text-align: center;
        font-weight: 600;
        color: #233166;
        padding: 0.5rem 0;
        font-size: 0.85rem;
    }

    .calendar-day {
        font-family: 'Heebo', sans-serif;
        font-weight: 500;
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        font-size: 0.95rem;
        color: #333;
        position: relative;
        transition: all 0.2s ease;
        min-width: 0;
        overflow: hidden;
    }

    .calendar-day.empty {
        visibility: hidden;
    }

    .calendar-day.highlighted {
        background: #3090c9;
        color: white;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 2px 8px #3090c9;
    }

    .calendar-day.highlighted:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px #233166;
        background: #233166;
        transition: all 0.2s ease;
    }

    .tooltip-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
    }

    .calendar-tooltip {
        position: fixed;
        left: var(--tooltip-left, 50%);
        top: var(--tooltip-top, 50%);
        transform: translate(-50%, calc(-100% - 12px - 1em));
        background: #233166;
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        width: max-content;
        max-width: min(350px, calc(100vw - 2rem));
        white-space: normal;
        text-align: center;
        line-height: 1.5;
    }

    .calendar-tooltip.visible {
        opacity: 1;
    }

    .calendar-tooltip::after {
        content: '';
        position: absolute;
        border: 6px solid transparent;
        bottom: -12px;
        left: var(--arrow-left, 50%);
        transform: translateX(-50%);
        border-top-color: #233166;
    }

    @media (max-width: 820px) {
        .calendars-container {
            padding: 0 0.5rem;
            gap: 1.5rem;
        }

        .calendar {
            padding: 1rem;
        }

        .calendar-grid {
            gap: 0.3rem;
        }

        .calendar-day {
            font-size: 0.8rem;
        }

        .calendar-day-header {
            font-size: 0.75rem;
        }

        .calendar-header h4 {
            font-size: 1.3rem;
        }
    }

    @media (max-width: 768px) {
        .search-box {
            flex-direction: column;
        }

        .search-button {
            width: 100%;
        }

        .previous-results-buttons {
            gap: 0.5rem;
        }

        .calendars-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 0 0.5rem;
        }

        .calendar {
            padding: 0.75rem;
        }

        .calendar-grid {
            gap: 0.15rem;
        }

        .calendar-day {
            font-size: 0.75rem;
            border-radius: 4px;
        }

        .calendar-day-header {
            font-size: 0.7rem;
            padding: 0.35rem 0;
        }

        .calendar-header {
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
        }

        .calendar-header h4 {
            font-size: 1.1rem;
        }

        .calendar-tooltip {
            max-width: min(280px, calc(100vw - 2rem));
            font-size: 0.75rem;
            padding: 0.5rem 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .calendars-container {
            padding: 0 0.25rem;
        }

        .calendar {
            padding: 0.5rem;
        }

        .calendar-grid {
            gap: 0.1rem;
        }

        .calendar-day {
            font-size: 0.7rem;
            border-radius: 3px;
        }

        .calendar-day-header {
            font-size: 0.65rem;
            padding: 0.25rem 0;
        }

        .calendar-header {
            margin-bottom: 0.5rem;
            padding-bottom: 0.35rem;
        }

        .calendar-header h4 {
            font-size: 1rem;
        }

        .calendar-tooltip {
            max-width: calc(100vw - 1rem);
            font-size: 0.7rem;
            padding: 0.4rem 0.6rem;
        }
    }
</style>

<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { findDistrictsForAddress } from '$lib/districtLookup.js';
    import { getRaceByDistrict } from '$lib/googleSheets.js';
    import { saveRacesToLocalStorage, loadRacesFromLocalStorage } from '$lib/raceStorage.js';
    import { initializeDistrictMap } from '$lib/mapUtils.js';
    
    export let data;

    function navigate(url) {
        if (url.startsWith('http')) {
            window.location.href = url;
        } else {
            goto(`${base}${url}`);
        }
    }

    let pymChild;
    let contentElement;
    
    // Address search state
    let searchAddress = '';
    let searching = false;
    let searchError = null;
    let districtResults = null;
    let suggestions = [];
    let showSuggestions = false;
    let debounceTimer;
    
    // Saved races from localStorage
    let savedRaces = null;
    
    // Tooltip state
    let currentTooltipText = '';
    let tooltipVisible = false;
    let tooltipLeft = '50%';
    let tooltipTop = '50%';
    let arrowLeft = '50%';

    // Key dates for the calendar
    const keyDates = {
        '10-22': 'Early in-person voting begins (availability varies by municipality)',
        '10-31': 'Last day to request an absentee ballot',
        '11-03': 'Last day of early in-person voting (availability varies by municipality)',
        '11-05': 'Election Day: Polls are open from 7 a.m. to 8 p.m. (Absentee ballots must be returned by 8 p.m.)'
    };

    function generateCalendar(month, year) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days = [];
        
        // Add empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ day: null, isEmpty: true });
        }
        
        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const dateKey = `${monthStr}-${dayStr}`;
            const isHighlighted = keyDates.hasOwnProperty(dateKey);
            
            days.push({
                day,
                isEmpty: false,
                isHighlighted,
                tooltip: isHighlighted ? keyDates[dateKey] : null
            });
        }
        
        return days;
    }

    const octoberDays = generateCalendar(9, 2026); // October = month 9 (0-indexed)
    const novemberDays = generateCalendar(10, 2026); // November = month 10

    async function fetchSuggestions(query) {
        if (query.length < 10) {
            suggestions = [];
            showSuggestions = false;
            return;
        }

        try {
            // Call Mapbox API directly with the public token
            const encodedQuery = encodeURIComponent(query);
            const mapboxToken = data.mapboxToken;
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&country=US&limit=5&types=address&bbox=-92.889,42.491,-86.249,47.309`;
            
            const response = await fetch(url);
            if (response.ok) {
                const responseData = await response.json();
                // Filter to only include Wisconsin addresses with complete street addresses
                const wisconsinSuggestions = responseData.features.filter(feature => {
                    const context = feature.context || [];
                    const isInWisconsin = context.some(ctx => 
                        ctx.id.startsWith('region') && 
                        (ctx.text === 'Wisconsin' || ctx.short_code === 'US-WI')
                    );
                    
                    // Ensure it's a complete address (has street number)
                    const addressText = feature.place_name || feature.text || '';
                    const hasStreetNumber = /^\d+/.test(addressText.trim());
                    
                    // Ensure it's actually an address type, not just a street
                    const isAddressType = feature.place_type && feature.place_type.includes('address');
                    return isInWisconsin && hasStreetNumber && isAddressType;
                });
                
                suggestions = wisconsinSuggestions.map(feature => ({
                    text: feature.place_name,
                    coordinates: feature.center
                }));
                showSuggestions = suggestions.length > 0;
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    function handleInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchSuggestions(searchAddress);
        }, 300);
    }

    function selectSuggestion(suggestion) {
        searchAddress = suggestion.text;
        suggestions = [];
        showSuggestions = false;
        handleAddressSearch();
    }

    function validateAddressFormat(address) {
        // Check if address contains a street number at the beginning
        const hasStreetNumber = /^\d+/.test(address.trim());
        
        // Check if address has multiple components (street number, street name, city)
        const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);
        const hasMultipleParts = parts.length >= 2;
        
        // Check if it's just a city name (no street number)
        const cityOnlyPattern = /^[A-Za-z\s]+,?\s*(WI|Wisconsin)?$/i;
        const isCityOnly = cityOnlyPattern.test(address.trim());
        
        // Check if it's just a street name without number
        const streetOnlyPattern = /^[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Circle|Cir)$/i;
        const isStreetOnly = streetOnlyPattern.test(address.trim());
        
        return hasStreetNumber && hasMultipleParts && !isCityOnly && !isStreetOnly;
    }

    async function handleAddressSearch() {
        if (!searchAddress.trim()) {
            searchError = 'Please enter an address';
            return;
        }
        
        // Validate address format before searching
        if (!validateAddressFormat(searchAddress)) {
            searchError = 'Please enter a complete physical address including street number, street name, and city. Example: "2 E Main Street, Madison, WI"';
            return;
        }

        searching = true;
        searchError = null;
        districtResults = null;
        showSuggestions = false;

        try {
            districtResults = await findDistrictsForAddress(searchAddress, data.mapboxToken);
            
            // Fetch race IDs for each district
            if (districtResults && districtResults.districts) {
                const races = await Promise.all([
                    districtResults.districts.assembly ? getRaceByDistrict(districtResults.districts.assembly, 'Assembly') : null,
                    districtResults.districts.senate ? getRaceByDistrict(districtResults.districts.senate, 'Senate') : null,
                    districtResults.districts.congress ? getRaceByDistrict(districtResults.districts.congress, 'US Congress') : null
                ]);
                
                districtResults.raceIds = {
                    assembly: races[0]?.['race-id'] || null,
                    senate: races[1]?.['race-id'] || null,
                    congress: races[2]?.['race-id'] || null
                };
                
                // Save races to localStorage
                savedRaces = saveRacesToLocalStorage(districtResults.raceIds, districtResults.address);
            }
            
            // Wait for DOM update then initialize maps
            setTimeout(initializeMaps, 100);
        } catch (error) {
            searchError = error.message || 'Failed to find districts for this address';
            console.error('District search error:', error);
        } finally {
            searching = false;
        }
    }

    function initializeMaps() {
        if (!districtResults || typeof mapboxgl === 'undefined') return;

        const accessToken = data.mapboxToken;
        if (!accessToken) return;

        mapboxgl.accessToken = accessToken;

        // Initialize Assembly map
        if (districtResults.districts.assembly) {
            initializeDistrictMap('assembly-map', 'wisconsinwatch.6gs2v405', 'ASM2024', districtResults.districts.assembly);
        }

        // Initialize Senate map
        if (districtResults.districts.senate) {
            initializeDistrictMap('senate-map', 'wisconsinwatch.7scp33x9', 'SEN2024', districtResults.districts.senate);
        }

        // Initialize Congress map
        if (districtResults.districts.congress) {
            initializeDistrictMap('congress-map', 'wisconsinwatch.5mz9q1z2', 'CON2021', districtResults.districts.congress);
        }
    }

    onMount(() => {
        // Initialize pym.js child
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
        
        // Load saved races from localStorage
        savedRaces = loadRacesFromLocalStorage();

        // Add tooltip positioning logic after a short delay to ensure DOM is ready
        setTimeout(() => {
            setupTooltipPositioning();
        }, 100);
    });

    function setupTooltipPositioning() {
        // Get all highlighted calendar days
        const highlightedDays = document.querySelectorAll('.calendar-day.highlighted');
        
        highlightedDays.forEach(day => {
            day.addEventListener('mouseenter', (e) => {
                const tooltip = e.currentTarget.getAttribute('data-tooltip');
                if (tooltip) {
                    currentTooltipText = tooltip;
                    tooltipVisible = true;
                    
                    // Calculate position based on cursor and hovered element
                    positionTooltipAtCursor(e);
                }
            });

            day.addEventListener('mouseleave', () => {
                tooltipVisible = false;
                currentTooltipText = '';
            });
        });
    }
    
    function positionTooltipAtCursor(event) {
        const tooltipElement = document.querySelector('.calendar-tooltip');
        const section = document.querySelector('#Keydates');
        
        if (!tooltipElement || !section) return;
        
        // Get cursor position
        const cursorX = event.clientX;
        const cursorY = event.clientY;
        
        // Set initial position at cursor location
        tooltipLeft = `${cursorX}px`;
        tooltipTop = `${cursorY}px`;
        
        // Wait for tooltip to render with new content, then check for overflow
        setTimeout(() => {
            const tooltipRect = tooltipElement.getBoundingClientRect();
            const sectionRect = section.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width;
            const tooltipHalfWidth = tooltipWidth / 2;
            
            // Calculate desired center position (at cursor X)
            let finalLeft = cursorX;
            
            // Section boundaries with padding
            const sectionPadding = 16;
            const minLeft = sectionRect.left + sectionPadding + tooltipHalfWidth;
            const maxLeft = sectionRect.right - sectionPadding - tooltipHalfWidth;
            
            // Adjust if overflowing left or right
            if (finalLeft < minLeft) {
                finalLeft = minLeft;
            } else if (finalLeft > maxLeft) {
                finalLeft = maxLeft;
            }
            
            tooltipLeft = `${finalLeft}px`;
            
            // Calculate arrow position
            // Arrow should point to cursor position, offset from tooltip center
            const arrowOffset = cursorX - finalLeft;
            const arrowPosition = 50 + ((arrowOffset / tooltipWidth) * 100);
            
            // Clamp arrow to stay within tooltip
            arrowLeft = `${Math.max(15, Math.min(85, arrowPosition))}%`;
        }, 0);
    }
</script>

<div id="content" class="site-content" bind:this={contentElement}>
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">

            <section class="hero">
                <header class="entry-header">						
                    <h1 class="entry-title ">Wisconsin 2026 voter guide TBD</h1>
                </header>
            </section>

            <div class="entry-content">
                <div class="entry-content">
		
                    <h2 class="wp-block-heading has-text-align-center">National and statewide elections</h2>

                        <div class="block-buttons is-horizontal is-content-justification-center is-layout-flex">
                            <button class="election-button" on:click={() => navigate('/wisconsin-governor')}>Wisconsin Governor</button>
                        </div>

                    <section id="address-map">
                        <h2 class="wp-block-heading has-text-align-center"><strong>Find Your Districts</strong></h2>
                        <p class="has-text-align-center">Enter your Wisconsin address to find your Assembly, Senate, and Congressional districts.</p>
                        <div class="address-search-container">
                            <div class="search-box">
                                <input 
                                    type="text" 
                                    bind:value={searchAddress}
                                    on:input={handleInput}
                                    on:keydown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                    on:blur={() => setTimeout(() => showSuggestions = false, 200)}
                                    placeholder="Enter your address (e.g., 2 E Main St, Madison, WI)"
                                    class="address-input"
                                    disabled={searching}
                                    autocomplete="off"
                                />
                                
                                {#if showSuggestions && suggestions.length > 0}
                                    <div class="suggestions-dropdown">
                                        {#each suggestions as suggestion}
                                            <button 
                                                class="suggestion-item"
                                                on:click={() => selectSuggestion(suggestion)}
                                                type="button"
                                            >
                                                {suggestion.text}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}

                                <button 
                                    on:click={handleAddressSearch}
                                    disabled={searching}
                                    class="search-button"
                                >
                                    {searching ? 'Searching...' : 'Search'}
                                    {#if !searching}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 1em; width: 1em; margin-left: 0.5rem; vertical-align: middle; display: inline-block;">
                                            <g>
                                                <circle cx="8.4" cy="8.4" r="6.9" style="fill: #3091c9;"/>
                                                <path d="M8.4,3c2.98,0,5.4,2.42,5.4,5.4s-2.42,5.4-5.4,5.4-5.4-2.42-5.4-5.4,2.42-5.4,5.4-5.4M8.4,0C3.76,0,0,3.76,0,8.4s3.76,8.4,8.4,8.4,8.4-3.76,8.4-8.4S13.04,0,8.4,0h0Z" style="fill: #fff;"/>
                                            </g>
                                            <line x1="24" y1="24" x2="14.08" y2="14.26" style="fill: none; stroke: #fff; stroke-miterlimit: 10; stroke-width: 3px;"/>
                                        </svg>
                                    {/if}
                                </button>
                            </div>
                            <small><i>We do not save your data! Read our privacy policy <a href="https://wisconsinwatch.org/about/user-agreement-and-privacy-policy/">here</a> .</i></small> 

                            {#if searchError}
                                <div class="error-message">
                                    <p><strong>Error:</strong> {searchError}</p>
                                </div>
                            {/if}

                            {#if districtResults}
                                <div class="results-container">
                                    <h3>Your Districts</h3>
                                    <p class="address-result"><strong>Address:</strong> {districtResults.address}</p>
                                    
                                    <div class="district-results">
                                        {#if districtResults.raceIds?.assembly}
                                            <a href="{base}/assembly/{districtResults.raceIds.assembly}" class="district-card district-card-link">
                                                <p class="district-number">
                                                    State Assembly {districtResults.districts.assembly ? `District ${districtResults.districts.assembly}` : 'Not found'}
                                                </p>
                                                {#if districtResults.districts.assembly}
                                                    <div id="assembly-map" class="district-map"></div>
                                                {/if}
                                                <p class="click-hint">Click to view race details</p>
                                            </a>
                                        {:else}
                                            <div class="district-card">
                                                <p class="district-number">State Assembly Not found</p>
                                            </div>
                                        {/if}

                                        {#if districtResults.raceIds?.senate}
                                            <a href="{base}/senate/{districtResults.raceIds.senate}" class="district-card district-card-link">
                                                <p class="district-number">
                                                    Senate {districtResults.districts.senate ? `District ${districtResults.districts.senate}` : 'Not found'}
                                                </p>
                                                {#if districtResults.districts.senate}
                                                    <div id="senate-map" class="district-map"></div>
                                                {/if}
                                                <p class="click-hint">Click to view race details</p>
                                            </a>
                                        {:else}
                                            <div class="district-card">
                                                <p class="district-number">Senate Not found</p>
                                            </div>
                                        {/if}

                                        {#if districtResults.raceIds?.congress}
                                            <a href="{base}/congress/{districtResults.raceIds.congress}" class="district-card district-card-link">
                                                <p class="district-number">
                                                   U.S. Congress {districtResults.districts.congress ? `District ${districtResults.districts.congress}` : 'Not found'}
                                                </p>
                                                {#if districtResults.districts.congress}
                                                    <div id="congress-map" class="district-map"></div>
                                                {/if}
                                                <p class="click-hint">Click to view race details</p>
                                            </a>
                                        {:else}
                                            <div class="district-card">
                                                <p class="district-number">U.S. Congress Not found</p>
                                            </div>
                                        {/if}
                                    </div>

                                    <p class="coordinates-info">
                                        <small>Location coordinates: {districtResults.coordinates.lat.toFixed(6)}, {districtResults.coordinates.lng.toFixed(6)}</small>
                                    </p>
                                </div>
                            {/if}
                        </div>
                        
                        {#if savedRaces && (savedRaces.assembly || savedRaces.senate || savedRaces.congress)}
                            <div class="previous-results-container">
                                <h3 style="margin-bottom: 0; margin-top: 0;">Your Previous Search Results</h3>
                                {#if savedRaces.address}
                                    <small class="address-result"><strong>Address:</strong> {savedRaces.address}</small>
                                {/if}
                                <div class="previous-results-buttons">
                                    {#if savedRaces.assembly}
                                        <button class="previous-result-button" on:click={() => goto(`${base}/assembly/${savedRaces.assembly}`)}>
                                            State Assembly
                                        </button>
                                    {/if}
                                    {#if savedRaces.senate}
                                        <button class="previous-result-button" on:click={() => goto(`${base}/senate/${savedRaces.senate}`)}>
                                            Senate
                                        </button>
                                    {/if}
                                    {#if savedRaces.congress}
                                        <button class="previous-result-button" on:click={() => goto(`${base}/congress/${savedRaces.congress}`)}>
                                            U.S. Congress
                                        </button>
                                    {/if}
                                </div>
                            </div> 
                        {/if}
                    </section>

                    <section id="Keydates" style="margin: 0 0; overflow-x: hidden; width: 100%; position: relative;">
                        <h2 class="wp-block-heading has-text-align-center">Save these dates</h2>
                        <p class="has-text-align-center"><small><i>Hover over highlighted dates for details</i></small></p>
                        
                        <!-- Dedicated Tooltip Container -->
                        <div class="tooltip-container">
                            <div class="calendar-tooltip {tooltipVisible ? 'visible' : ''}" 
                                 style="--tooltip-left: {tooltipLeft}; --tooltip-top: {tooltipTop}; --arrow-left: {arrowLeft};">
                                {currentTooltipText}
                            </div>
                        </div>
                        
                        <div class="calendars-container">
                            <!-- October 2026 Calendar -->
                            <div class="calendar">
                                <div class="calendar-header">
                                    <h4>October 2026</h4>
                                </div>
                                <div class="calendar-grid">
                                    <div class="calendar-day-header">Sun</div>
                                    <div class="calendar-day-header">Mon</div>
                                    <div class="calendar-day-header">Tue</div>
                                    <div class="calendar-day-header">Wed</div>
                                    <div class="calendar-day-header">Thu</div>
                                    <div class="calendar-day-header">Fri</div>
                                    <div class="calendar-day-header">Sat</div>
                                    
                                    {#each octoberDays as dayInfo}
                                        <div class="calendar-day {dayInfo.isEmpty ? 'empty' : ''} {dayInfo.isHighlighted ? 'highlighted' : ''}" 
                                             data-tooltip="{dayInfo.isHighlighted ? dayInfo.tooltip : ''}">
                                            {#if !dayInfo.isEmpty}
                                                {dayInfo.day}
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <!-- November 2026 Calendar -->
                            <div class="calendar">
                                <div class="calendar-header">
                                    <h4>November 2026</h4>
                                </div>
                                <div class="calendar-grid">
                                    <div class="calendar-day-header">Sun</div>
                                    <div class="calendar-day-header">Mon</div>
                                    <div class="calendar-day-header">Tue</div>
                                    <div class="calendar-day-header">Wed</div>
                                    <div class="calendar-day-header">Thu</div>
                                    <div class="calendar-day-header">Fri</div>
                                    <div class="calendar-day-header">Sat</div>
                                    
                                    {#each novemberDays as dayInfo}
                                        <div class="calendar-day {dayInfo.isEmpty ? 'empty' : ''} {dayInfo.isHighlighted ? 'highlighted' : ''}" 
                                             data-tooltip="{dayInfo.isHighlighted ? dayInfo.tooltip : ''}">
                                            {#if !dayInfo.isEmpty}
                                                {dayInfo.day}
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="voting-info">
                        <h2 class="wp-block-heading has-text-align-center">Election Q&As</h2>
                        <div class ="bento-container grid grid-cols-12 grid-flow-dense gap-4">
                            <section class="bento-section bento-section-primary ring col-span-full md:col-span-6 xl:col-span-6 xl:row-span-3">
                                <div class="bento-image-container">
                                    <img srcset="https://wisconsinwatch.org/wp-content/uploads/2024/11/Legislative-Race-Results-1.jpg">
                                    <figcaption><span>Jennifer Taylor, left, votes during Election Day on Nov. 5, 2024, at Madison East High School in Madison, Wis. (Joe Timmerman / Wisconsin Watch)</span></figcaption>
                                </div>
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>Who can vote?</strong></h3>
                                    <p>To register to vote in Wisconsin, you must meet the following <a href="https://www.cityofmadison.com/clerk/elections-voting/voter-registration/eligibility-to-vote">requirements</a>:</p>
                                    <ul class="wp-block-list">
                                        <li>Be a United States citizen.</li>
                                        <li>Be age 18 or older by Election Day.</li>
                                        <li>Have resided at your current address for at least 28 days before Election Day.</li>
                                        <li>If you've been convicted of a felony, you must have completed your sentence, including probation, parole or extended supervision.</li>
                                        <li>Have not been adjudicated incompetent to vote by a judge.</li>
                                    </ul>
                                </div>
                            </section>

                            <section class="bento-section bento-section-primary ring col-span-full md:col-span-6 xl:col-span-6 xl:row-span-3">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>How do you check if you're registered?</strong></h3>
                                    <p>You can check your registration status on the MyVote Wisconsin website <a href="https://myvote.wi.gov/en-us/Register-To-Vote">here</a> by entering your name and date of birth.</p>
                                    <p>The deadline to register <a href="https://myvote.wi.gov/en-us/Register-To-Vote">online</a> or by mail is Oct. 16. The deadline to register in person at your municipal clerk's office is Nov. 1 at 5 p.m. If you haven't registered to vote before Nov. 5, don't panic. You can register to vote in person at your polling place on Election Day. You'll just need to bring an <a href="https://myvote.wi.gov/Portals/0/Documents/AcceptablePhotoIDs.pdf?ver=vS9TnMVULlI9Yi0mGe-P0g%3D%3D">accepted form of ID</a> and <a href="https://myvote.wi.gov/Portals/0/Documents/ProofOfResidence.pdf?ver=vS9TnMVULlI9Yi0mGe-P0g%3d%3d">proof of residence</a> (and meet the requirements listed above).</p>
                                </div>
                                <div class="bento-image-container">
                                    <img srcset="https://wisconsinwatch.org/wp-content/uploads/2024/11/20241105-General-Election-Voting-Timmerman-44.jpg">
                                    <figcaption><span>Stephanie Rushing, Milwaukee Election Commission election services coordinator, sorts through rejected absentee ballots on Election Day, Nov. 5, 2024, at Milwaukee Central Count at the Baird Center in Milwaukee. (Joe Timmerman / Wisconsin Watch)</span></figcaption>
                                </div>
                            </section>

                            <section class="bento-section bento-section-primary ring col-span-full md:col-span-12 xl:col-span-8 xl:row-span-2">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>Can I vote by mail?</strong></h3>
                                    <p>Yes. Wisconsin voters don't need a reason to vote by mail/be an absentee voter. Every registered Wisconsin voter has the ability to request an absentee ballot by mail. You can request an absentee ballot on MyVote Wisconsin <a href="https://myvote.wi.gov/en-us/Vote-Absentee-By-Mail">here</a>.</p>
                                    <p>Once you've submitted your request for an absentee ballot, you can track your ballot <a href="https://myvote.wi.gov/en-us/Track-My-Ballot">here</a>.</p>
                                    <p>Before you begin filling out your absentee ballot, make sure you have a witness who can verify that you filled out your own ballot. The witness needs to be an adult U.S. citizen who is not a candidate in the upcoming election. Once you've completed your ballot, place it in the certified envelope that comes with your absentee ballot. Seal and sign the certificate envelope and then have your witness sign the certificate and include the witness' address.</p>
                                    <p>The next step is to mail it back to your municipal clerk. The United States Postal Service recommends mailing your ballot back at least seven days before Election Day, according to the Wisconsin Elections Commission.</p>
                                    <p>If you're worried about your ballot being returned in time, you can deliver it to your municipal clerk's office or deliver it to your polling place on Election Day.</p>
                                </div>
                            </section>

                            <section class="bento-section bento-section-tertiary ring col-span-full md:col-span-12 xl:col-span-4 md:row-span-1">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>How do I find my polling place?</strong></h3>
                                    <p class="has-text-align-center">You can find your polling location by entering your address <a href="https://myvote.wi.gov/en-us/Find-My-Polling-Place">here</a>.</p>
                                </div>
                            </section>

                            <section class="bento-section bento-section-secondary ring col-span-full md:col-span-12 xl:col-span-4 xl:row-span-1">
                                <div class="bento-body">
                                    <h3 class="wp-block-heading has-text-align-center"><strong>Can I put my absentee ballot in a ballot drop box?</strong></h3>
                                    <p>Yes. The Wisconsin Supreme Court recently <a href="https://wisconsinwatch.org/2024/07/wisconsin-supreme-court-allows-expanded-use-of-ballot-drop-boxes/">ruled</a> that Wisconsin communities can once again use drop boxes to collect absentee ballots. However, the use of drop boxes is not required, so it's up to your municipal clerk whether they are available in your community or not.</p>
                                </div>
                            </section>

                        </div>
                    </section>



                    <!--Some other element samples-->

                    <details class="wp-block-details is-layout-flow wp-block-details-is-layout-flow">
                        <summary>Here's what you need to know</summary>
                        <p>In western Wisconsin, both state and national <a href="https://wisconsinwatch.org/2024/10/wisconsin-congress-van-orden-cooke-republican-democrat-us-house/">Democrats are looking to unseat incumbent U.S. Rep. Derrick Van Orden</a>, a freshman Republican being challenged by Democrat Rebecca Cooke. Van Orden flipped the seat in 2022, and Democrats are hoping to take it back in their push to retake the U.S. House majority.</p>
                        <p>In the Milwaukee area, Republicans are hoping to help incumbent state Sen. Duey Stroebel, R-Saukville, <a href="https://wisconsinwatch.org/2024/09/wisconsin-milwaukee-senate-election-democrat-republican-stroebel-habush-sinykin/">survive a challenge from Democrat Jodi Habush Sinykin</a>. The race is one of a handful of state Senate seats that will set the field for races in 2026, in which Democrats will look to also flip control of the state Senate.</p>
                        <p>And those are just a few examples. Elections consequential to the daily lives of Wisconsin residents across the state are on the ballot.</p>
                    </details>
                    
                    <!--Self populated list of stories-->

                        <h2 class="wp-block-heading has-text-align-center" id="News">Latest election news from Wisconsin Watch</h2>
                            <ul class="wp-block-latest-posts__list is-grid columns-3 wp-block-latest-posts" id="latest-election-2024-news-and-resources">
                                {#each data.stories as story (story.id)}
                                    <li><a data-post-id={story.id} class="wp-block-latest-posts__post-title" href={story.url}>{story.title}</a></li>
                                {/each}
                            </ul>

                    <!--Credit section-->
                        <div class="wp-block-group credits" style="padding-top: 1rem;">
                            <h4 class="wp-block-heading has-text-align-center">Credits</h4>
                            <p>Wisconsin Watch's voter guide is a team effort made possible by:</p>
                            <p>Reporters: </p>
                            <p>Editors: </p>
                        </div>
                    </div>
                </div> 
        </main>
    </section>  
</div>
