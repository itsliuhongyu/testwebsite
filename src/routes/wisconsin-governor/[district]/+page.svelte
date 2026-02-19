<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <link rel="stylesheet" href="{base}/css/election.css">
    <script src="https://pym.nprapps.org/pym.v1.min.js"></script>
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { getRaceByRaceId, getCandidateByCandidateId, getStoriesByRaceId } from '$lib/googleSheets.js';
    import { saveSourceRace } from '$lib/raceStorage.js';
    
    export let data;
    
    let race = null;
    let candidates = [];
    let stories = [];
    let loading = true;
    let error = null;
    let pymChild;
    let contentDiv;
    
    function navigateToCandidate(candidateId) {
        if (race) {
            saveSourceRace('governor', race['race-id']);
            goto(`${base}/wisconsin-governor/candidate/${candidateId}`);
        }
    }
    
    async function loadRaceData() {
        try {
            // For Governor, we expect district "1" or race-id "go-1"
            let raceId = $page.params.district;
            
            // If they navigate to /wisconsin-governor/1, look for go-1
            if (raceId === '1') {
                raceId = 'go-1';
            }
            
            race = await getRaceByRaceId(raceId, 'Governor');
            
            if (!race) {
                error = 'Race not found';
                loading = false;
                return;
            }
            
            // Load up to 5 candidates if they exist
            candidates = [];
            for (let i = 1; i <= 5; i++) {
                const candidateKey = `candidate-${i}`;
                if (race[candidateKey]) {
                    const candidate = await getCandidateByCandidateId(race[candidateKey]);
                    if (candidate) {
                        candidates.push(candidate);
                    }
                }
            }
            
            // Load stories for this race
            stories = await getStoriesByRaceId(raceId);
            
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
            console.error('Error fetching race:', err);
        }
    }
    
    onMount(() => {
        loadRaceData();
        
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
    });
    
    onDestroy(() => {
        if (pymChild) {
            pymChild = null;
        }
    });
</script>

<div id="content" class="site-content" bind:this={contentDiv}>
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">
            {#if loading}
                <div class="loading-message">
                    <p>Loading race information...</p>
                </div>
            {:else if error}
                <div class="error-message">
                    <p>Error: {error}</p>
                </div>
            {:else if race}
                <div class="race-detail">
                    <button class="back-button" on:click={() => goto(`${base}/`)}><img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home</button>
                    
                    <div class="race-header">
                        <h1>Wisconsin Governor Race</h1>
                    </div>
                    
                    {#if race['district-race-nutshell']}
                        <div class="info-section">
                            <h2>Race Overview</h2>
                            <p>{@html race['district-race-nutshell'].replace(/\n/g, '<br>')}</p>
                        </div>
                    {/if}
                    
                    <div class="info-section">
                        <h2>Candidates</h2>
                        <div class="candidates-grid">
                            {#each candidates as candidate}
                                <div class="candidate-card" on:click={() => navigateToCandidate(candidate.candidate_id)}>
                                    <div class="candidate-icon">
                                        <img src="{base}/graphics/plus.svg" alt="View details" />
                                    </div>
                                    {#if candidate.candidate_id}
                                        <img src="{base}/graphics/candidates/{candidate.candidate_id}.jpg" alt={candidate.name} class="candidate-photo" />
                                    {:else}
                                        <div class="candidate-placeholder">?</div>
                                    {/if}
                                    <div class="candidate-info">
                                        <p class="candidate-name">{candidate.name}</p>
                                        {#if candidate.party}
                                            <p class="candidate-party">{candidate.party}</p>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                    
                    {#if stories.length > 0}
                        <div class="info-section">
                            <h2>More stories here</h2>
                            <div class="stories-list">
                                {#each stories as story}
                                    <div class="story-item">
                                        <a href={story.url} target="_blank" rel="noopener noreferrer" class="story-headline">
                                            {story.headline}
                                        </a>
                                        {#if story.publisher}
                                            <div class="story-publisher">{story.publisher}</div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </main>
    </section>
</div>
