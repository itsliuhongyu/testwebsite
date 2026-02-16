<svelte:head>
    <link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
    <link rel="stylesheet" href="{base}/css/wp-custom.css">
    <script src="https://pym.nprapps.org/pym.v1.min.js"></script>
</svelte:head>

<style>
    .race-detail {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    .race-header {
        text-align: center;
        margin-bottom: 2rem;
        padding: 2rem;
        background-color: #f5f5f5;
        border-radius: 8px;
    }
    
    .race-header h1 {
        margin: 0 0 0.5rem 0;
        color: #0073aa;
    }
    
    .info-section {
        margin: 2rem 0;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
    }
    
    .info-section h2 {
        color: #0073aa;
        border-bottom: 2px solid #0073aa;
        padding-bottom: 0.5rem;
        margin-top: 0;
    }
    
    .candidates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
    }
    
    .candidate-card {
        background-color: white;
        border: 2px solid #0073aa;
        border-radius: 8px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .candidate-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 115, 170, 0.3);
        border-color: #005a87;
    }
    
    .candidate-photo {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 1rem;
    }
    
    .candidate-placeholder {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background-color: #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: #999;
        margin-bottom: 1rem;
    }
    
    .candidate-name {
        font-size: 1.25rem;
        font-weight: bold;
        color: #333;
        margin: 0.5rem 0;
    }
    
    .candidate-party {
        color: #666;
        font-size: 1rem;
        margin: 0.25rem 0;
    }
    
    .back-button {
        display: inline-block;
        margin-bottom: 1rem;
        padding: 0.75rem 1.5rem;
        background-color: #0073aa;
        color: white !important;
        text-decoration: none;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
    }
    
    .back-button:hover {
        background-color: #005a87;
    }
    
    .loading-message, .error-message {
        text-align: center;
        padding: 2rem;
    }
    
    .error-message {
        color: red;
    }
    
    @media (max-width: 768px) {
        .candidates-grid {
            grid-template-columns: 1fr;
        }
    }
</style>

<script>
    import { base } from '$app/paths';
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { getRaceByRaceId, getCandidateByCandidateId } from '$lib/googleSheets.js';
    import { saveSourceRace } from '$lib/raceStorage.js';
    
    export let data;
    
    let race = null;
    let candidates = [];
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
                    <button class="back-button" on:click={() => goto(`${base}/`)}>← Back to Main Page</button>
                    
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
                                    {#if candidate.image}
                                        <img src={candidate.image} alt={candidate.name} class="candidate-photo" />
                                    {:else}
                                        <div class="candidate-placeholder">?</div>
                                    {/if}
                                    <div class="candidate-name">{candidate.name}</div>
                                    {#if candidate.party}
                                        <div class="candidate-party">{candidate.party}</div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        </main>
    </section>
</div>
